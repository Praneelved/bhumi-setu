import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

conn = psycopg2.connect(host='127.0.0.1', port=5433, user='postgres', dbname='postgres')
conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
cur = conn.cursor()
cur.execute("SELECT 1 FROM pg_database WHERE datname = 'land_acquisition_db';")
if not cur.fetchone():
    cur.execute('CREATE DATABASE land_acquisition_db;')
    print('Created database land_acquisition_db!')
else:
    print('Database land_acquisition_db already exists!')
cur.close()
conn.close()

conn2 = psycopg2.connect(host='127.0.0.1', port=5433, user='postgres', dbname='land_acquisition_db')
print('Connected successfully to land_acquisition_db on port 5433!')
conn2.close()
