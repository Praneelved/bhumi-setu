"""
SQLite Compatibility Layer for BhoomiSetu
==========================================
Provides a psycopg2-compatible interface backed by SQLite3.
Handles:
  - %s -> ? placeholder translation
  - RETURNING clause emulation
  - RealDictCursor emulation (rows as dict-like objects)
  - PostgreSQL-specific DDL → SQLite DDL translation
  - ON CONFLICT DO NOTHING support
  - TIMESTAMPTZ, gen_random_uuid(), SERIAL etc. normalization
"""

import sqlite3
import re
import uuid
import os
import threading

DB_PATH = os.path.join(os.path.dirname(__file__), "bhoomisetu_local.db")

# Thread-local connection store for thread safety
_local = threading.local()


def _get_local_conn():
    if not hasattr(_local, "conn") or _local.conn is None:
        _local.conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        _local.conn.row_factory = sqlite3.Row
        _local.conn.execute("PRAGMA journal_mode=WAL")
        _local.conn.execute("PRAGMA foreign_keys=ON")
    return _local.conn


def _translate_sql(sql: str) -> str:
    """Translate PostgreSQL SQL to SQLite SQL."""
    # Replace %s with ?
    sql = sql.replace("%s", "?")

    # Remove RETURNING clause (we handle it separately)
    sql = re.sub(r'\s+RETURNING\s+\S+\s*;?\s*$', '', sql, flags=re.IGNORECASE | re.MULTILINE)
    sql = re.sub(r'\s+RETURNING\s+\S+', '', sql, flags=re.IGNORECASE)

    # TIMESTAMPTZ -> TEXT
    sql = re.sub(r'TIMESTAMPTZ', 'TEXT', sql, flags=re.IGNORECASE)

    # DEFAULT NOW() -> DEFAULT CURRENT_TIMESTAMP
    sql = re.sub(r'DEFAULT\s+NOW\(\)', 'DEFAULT CURRENT_TIMESTAMP', sql, flags=re.IGNORECASE)
    sql = re.sub(r'\bNOW\(\)', 'CURRENT_TIMESTAMP', sql, flags=re.IGNORECASE)

    # gen_random_uuid()::VARCHAR -> (lower(hex(randomblob(4))) || '-' || ...)
    sql = re.sub(r"DEFAULT\s+gen_random_uuid\(\)::VARCHAR", "DEFAULT (lower(hex(randomblob(16))))", sql, flags=re.IGNORECASE)
    sql = re.sub(r"gen_random_uuid\(\)::VARCHAR", "(lower(hex(randomblob(16))))", sql, flags=re.IGNORECASE)
    sql = re.sub(r"gen_random_uuid\(\)", "(lower(hex(randomblob(16))))", sql, flags=re.IGNORECASE)

    # SERIAL PRIMARY KEY -> INTEGER PRIMARY KEY AUTOINCREMENT
    sql = re.sub(r'\bSERIAL\b', 'INTEGER', sql, flags=re.IGNORECASE)

    # ON CONFLICT DO NOTHING -> OR IGNORE
    sql = re.sub(r'\bON\s+CONFLICT\s+DO\s+NOTHING\b', '', sql, flags=re.IGNORECASE)

    # ANY(%s) -> We handle this differently in cursor
    # ALTER TABLE ... ADD COLUMN IF NOT EXISTS - SQLite doesn't support IF NOT EXISTS for columns
    # We'll handle that in the cursor

    # Remove ::VARCHAR, ::TEXT casts
    sql = re.sub(r'::[A-Z]+', '', sql, flags=re.IGNORECASE)

    # information_schema.columns -> sqlite_master (handled specially)
    
    # executemany with ON CONFLICT - use INSERT OR IGNORE
    sql = re.sub(r'\bINSERT INTO\b', 'INSERT OR IGNORE INTO', sql, flags=re.IGNORECASE)
    # But avoid double INSERT OR IGNORE
    sql = re.sub(r'INSERT OR IGNORE OR IGNORE INTO', 'INSERT OR IGNORE INTO', sql, flags=re.IGNORECASE)

    return sql.strip()


class SQLiteRealDictRow(dict):
    """Dict subclass that also supports index access like sqlite3.Row."""
    def __getitem__(self, key):
        if isinstance(key, int):
            return list(self.values())[key]
        return super().__getitem__(key)


class SQLiteCursor:
    def __init__(self, conn: sqlite3.Connection):
        self._conn = conn
        self._cursor = conn.cursor()
        self._last_insert_rowid = None
        self._last_table = None
        self._rows = []
        self._pos = 0

    def _row_to_dict(self, row) -> SQLiteRealDictRow:
        if row is None:
            return None
        if isinstance(row, sqlite3.Row):
            return SQLiteRealDictRow(dict(row))
        return SQLiteRealDictRow(row)

    def _handle_returning(self, sql: str, table: str):
        """After an INSERT, fetch the last inserted row."""
        try:
            rowid = self._cursor.lastrowid
            # Try to get the row by rowid
            result = self._conn.execute(f"SELECT * FROM {table} WHERE rowid = ?", (rowid,))
            row = result.fetchone()
            if row:
                self._rows = [self._row_to_dict(row)]
            else:
                self._rows = []
        except Exception:
            self._rows = []
        self._pos = 0

    def _extract_table_from_insert(self, sql: str) -> str:
        """Extract table name from INSERT INTO statement."""
        match = re.search(r'INSERT\s+(?:OR\s+IGNORE\s+)?INTO\s+(\w+)', sql, re.IGNORECASE)
        return match.group(1) if match else None

    def _check_column_exists(self, table: str, column: str) -> bool:
        """Check if a column exists in a table."""
        try:
            result = self._conn.execute(f"PRAGMA table_info({table})")
            cols = [row[1] for row in result.fetchall()]
            return column in cols
        except Exception:
            return False

    def _check_table_exists(self, table: str) -> bool:
        """Check if a table exists."""
        result = self._conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,)
        )
        return result.fetchone() is not None

    def execute(self, sql: str, params=None):
        original_sql = sql.strip()
        has_returning = bool(re.search(r'\bRETURNING\b', original_sql, re.IGNORECASE))
        
        # Handle information_schema.columns query specially
        if 'information_schema.columns' in original_sql.lower():
            # SELECT 1 FROM information_schema.columns WHERE table_name = ? AND column_name = ?
            match_table = None
            match_col = None
            if params and len(params) >= 2:
                # params might be (schema, table, column) from _column_exists
                if len(params) == 3:
                    match_table = params[1]
                    match_col = params[2]
                else:
                    match_table = params[0]
                    match_col = params[1]
            if match_table and match_col:
                exists = self._check_column_exists(match_table, match_col)
                if exists:
                    self._rows = [SQLiteRealDictRow({"1": 1})]
                else:
                    self._rows = []
                self._pos = 0
                return self

        # Handle ALTER TABLE ADD COLUMN
        if re.search(r'ALTER\s+TABLE\s+(\w+)\s+ADD\s+COLUMN\s+(\w+)', original_sql, re.IGNORECASE):
            match = re.search(r'ALTER\s+TABLE\s+(\w+)\s+ADD\s+COLUMN\s+(\w+)', original_sql, re.IGNORECASE)
            if match:
                table_name = match.group(1)
                col_name = match.group(2)
                # Skip if table doesn't exist yet (will be created later)
                if not self._check_table_exists(table_name):
                    self._rows = []
                    self._pos = 0
                    return self
                if self._check_column_exists(table_name, col_name):
                    self._rows = []
                    self._pos = 0
                    return self  # Column already exists, skip

        # Handle ALTER TABLE ADD COLUMN geometry_geojson (the try/except block in db.py)
        
        # Handle ANY(%s) for PostgreSQL array BEFORE translation
        if re.search(r'=\s*ANY\s*\(\s*%s\s*\)', original_sql, re.IGNORECASE):
            # Transform: phone = ANY(%s) with params like (identifier, ['a','b','c'])
            # into: phone IN (?,?,?) with expanded params
            if params:
                new_params = list(params)
                any_values = None
                any_idx = None
                for i, p in enumerate(new_params):
                    if isinstance(p, (list, tuple)):
                        any_values = list(p)
                        any_idx = i
                        break
                
                if any_values is not None and any_idx is not None:
                    placeholders = ','.join(['?' for _ in any_values])
                    # Replace the ANY(%s) pattern with IN (?,?,...)
                    modified_sql = re.sub(
                        r'=\s*ANY\s*\(\s*%s\s*\)',
                        f'IN ({placeholders})',
                        original_sql,
                        flags=re.IGNORECASE
                    )
                    new_params.pop(any_idx)
                    new_params[any_idx:any_idx] = any_values
                    original_sql = modified_sql
                    params = tuple(new_params)

        translated = _translate_sql(original_sql)
        table_name = self._extract_table_from_insert(original_sql) if has_returning else None

        try:
            if params is not None:
                # Flatten any remaining list params
                flat_params = []
                for p in params:
                    if isinstance(p, (list, tuple)):
                        flat_params.extend(p)
                    elif p is True:
                        flat_params.append(1)
                    elif p is False:
                        flat_params.append(0)
                    else:
                        flat_params.append(p)
                self._cursor.execute(translated, flat_params)
            else:
                self._cursor.execute(translated)
        except sqlite3.OperationalError as e:
            err_str = str(e)
            # Ignore duplicate column errors
            if 'duplicate column' in err_str.lower():
                self._rows = []
                self._pos = 0
                return self
            raise

        if has_returning and table_name:
            self._handle_returning(original_sql, table_name)
        else:
            # Fetch results for SELECT
            if translated.strip().upper().startswith('SELECT') or \
               'PRAGMA' in translated.upper():
                rows = self._cursor.fetchall()
                self._rows = [self._row_to_dict(r) for r in rows]
                self._pos = 0
            else:
                self._rows = []
                self._pos = 0

        return self

    def executemany(self, sql: str, params_list):
        original_sql = sql.strip()
        has_returning = bool(re.search(r'\bRETURNING\b', original_sql, re.IGNORECASE))
        translated = _translate_sql(original_sql)

        for params in params_list:
            flat_params = []
            for p in params:
                if isinstance(p, (list, tuple)):
                    flat_params.extend(p)
                elif p is True:
                    flat_params.append(1)
                elif p is False:
                    flat_params.append(0)
                else:
                    flat_params.append(p)
            try:
                self._cursor.execute(translated, flat_params)
            except sqlite3.OperationalError as e:
                if 'duplicate column' in str(e).lower():
                    continue
                raise
        self._rows = []
        self._pos = 0

    def fetchone(self):
        if self._rows and self._pos < len(self._rows):
            row = self._rows[self._pos]
            self._pos += 1
            return row
        # Also try reading from cursor directly
        raw = self._cursor.fetchone()
        if raw:
            return self._row_to_dict(raw)
        return None

    def fetchall(self):
        if self._rows:
            rows = self._rows[self._pos:]
            self._pos = len(self._rows)
            return rows
        raws = self._cursor.fetchall()
        return [self._row_to_dict(r) for r in raws]

    def __iter__(self):
        return iter(self.fetchall())

    @property
    def lastrowid(self):
        return self._cursor.lastrowid


class SQLiteConnection:
    """Psycopg2-compatible connection wrapper around sqlite3."""

    def __init__(self, db_path: str):
        self._conn = sqlite3.connect(db_path, check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._conn.execute("PRAGMA journal_mode=WAL")
        self._conn.execute("PRAGMA foreign_keys=OFF")  # Relax FK for seeding

    def cursor(self):
        return SQLiteCursor(self._conn)

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def close(self):
        self._conn.commit()  # Auto-commit on close
        # Don't actually close to allow reuse

    def execute(self, sql, params=None):
        cur = SQLiteCursor(self._conn)
        cur.execute(sql, params)
        return cur


def get_sqlite_db() -> SQLiteConnection:
    """Returns a SQLite connection with psycopg2-compatible interface."""
    return SQLiteConnection(DB_PATH)
