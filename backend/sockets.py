import socketio
import urllib.parse
from typing import Dict, Any, Optional
from auth import decode_access_token
from db import get_db

# Initialize Socket.IO AsyncServer
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*"
)

# Active connected client metadata: { sid: user_dict }
CONNECTED_CLIENTS: Dict[str, Dict[str, Any]] = {}

@sio.event
async def connect(sid: str, environ: Dict[str, Any], auth: Optional[Dict[str, Any]] = None):
    """
    Socket.IO Connection Handshake:
    Validates JWT token from auth object or query params,
    authorizes user, and subscribes to strictly permitted rooms.
    """
    token = None

    # Check auth payload
    if auth and isinstance(auth, dict) and "token" in auth:
        token = auth["token"]
    
    # Fallback to query string
    if not token and "QUERY_STRING" in environ:
        qs = urllib.parse.parse_qs(environ["QUERY_STRING"])
        if "token" in qs:
            token = qs["token"][0]

    if not token:
        # Reject unauthenticated connection
        print(f"Socket connection rejected for sid {sid}: Missing authentication token.")
        return False

    try:
        payload = decode_access_token(token)
        user_id = payload["sub"]

        # Retrieve user and authorized scopes from PostgreSQL
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT id, full_name, email, phone, user_type, role, organization_id, state, district, is_active FROM users WHERE id = %s AND is_active = TRUE;", (user_id,))
        user_row = cursor.fetchone()

        if not user_row:
            conn.close()
            print(f"Socket connection rejected for sid {sid}: Inactive user.")
            return False

        user = {k: (str(v) if k in ('id', 'organization_id') and v is not None else v) for k, v in dict(user_row).items()}
        user["name"] = user.pop("full_name", user.get("name", ""))
        user.pop("password_hash", None)

        # Get assigned projects
        cursor.execute("SELECT project_id FROM user_projects WHERE user_id = %s;", (user_id,))
        assigned_projects = [str(r["project_id"]) for r in cursor.fetchall()]
        user["assigned_projects"] = assigned_projects

        # Get linked parcels
        cursor.execute("SELECT parcel_id FROM user_parcels WHERE user_id = %s;", (user_id,))
        linked_parcels = [str(r["parcel_id"]) for r in cursor.fetchall()]
        user["linked_parcels"] = linked_parcels

        conn.close()

        # Save session
        CONNECTED_CLIENTS[sid] = user

        # 1. Join Personal User Room
        await sio.enter_room(sid, f"user:{user['id']}")

        # 2. Join Role-Specific Scoped Rooms
        role = user["role"]
        user_type = user["user_type"]
        state = user.get("state")
        district = user.get("district")
        org_id = user.get("organization_id")

        authorized_rooms = [f"user:{user['id']}"]

        if role == "CENTRAL_ADMIN":
            await sio.enter_room(sid, "national_dashboard")
            authorized_rooms.append("national_dashboard")

        if state and state != "All":
            await sio.enter_room(sid, f"state:{state}")
            authorized_rooms.append(f"state:{state}")

        if district and district != "All":
            await sio.enter_room(sid, f"district:{district}")
            authorized_rooms.append(f"district:{district}")

        if org_id:
            await sio.enter_room(sid, f"organization:{org_id}")
            authorized_rooms.append(f"organization:{org_id}")

        for prj_id in assigned_projects:
            await sio.enter_room(sid, f"project:{prj_id}")
            authorized_rooms.append(f"project:{prj_id}")

        for pcl_id in linked_parcels:
            await sio.enter_room(sid, f"parcel:{pcl_id}")
            authorized_rooms.append(f"parcel:{pcl_id}")

        print(f"Socket Client {sid} authenticated as {user['name']} ({role}). Rooms: {authorized_rooms}")
        await sio.emit("authenticated", {
            "user_id": user["id"],
            "name": user["name"],
            "role": role,
            "authorized_rooms": authorized_rooms
        }, to=sid)

        return True

    except Exception as e:
        print(f"Socket connection authentication error for sid {sid}: {e}")
        return False

@sio.event
async def disconnect(sid: str):
    user = CONNECTED_CLIENTS.pop(sid, None)
    if user:
        print(f"Socket client {sid} ({user['name']}) disconnected.")

@sio.event
async def subscribe_room(sid: str, data: Dict[str, Any]):
    """Allow client to subscribe to a specific room if authorized."""
    user = CONNECTED_CLIENTS.get(sid)
    if not user:
        return {"error": "Unauthorized"}
    
    room = data.get("room")
    if not room:
        return {"error": "Room name required"}

    # Validate authorization
    is_allowed = False
    if user["role"] == "CENTRAL_ADMIN":
        is_allowed = True
    elif room.startswith("state:") and room.split(":")[1] == user.get("state"):
        is_allowed = True
    elif room.startswith("district:") and room.split(":")[1] == user.get("district"):
        is_allowed = True
    elif room.startswith("organization:") and room.split(":")[1] == user.get("organization_id"):
        is_allowed = True
    elif room.startswith("project:") and room.split(":")[1] in user.get("assigned_projects", []):
        is_allowed = True
    elif room.startswith("parcel:") and room.split(":")[1] in user.get("linked_parcels", []):
        is_allowed = True
    elif room == f"user:{user['id']}":
        is_allowed = True

    if is_allowed:
        await sio.enter_room(sid, room)
        return {"success": True, "room": room}
    else:
        return {"error": f"Forbidden: Insufficient privileges to join room {room}"}

# --- Broadcasting Helpers for REST APIs ---

async def broadcast_parcel_status_changed(parcel: Dict[str, Any]):
    """Emits parcel status change to project, district, and linked landowner rooms."""
    project_id = parcel.get("project_id", "prj-nh704")
    parcel_id = parcel.get("id")

    payload = {
        "event": "parcel_status_changed",
        "parcel": parcel
    }
    # Emit to project room
    await sio.emit("parcel_status_changed", payload, room=f"project:{project_id}")
    # Emit to specific parcel room (landowner)
    await sio.emit("parcel_status_changed", payload, room=f"parcel:{parcel_id}")
    # Emit to national dashboard for executive real-time overview
    await sio.emit("parcel_status_changed", payload, room="national_dashboard")

async def broadcast_parcel_verified(parcel: Dict[str, Any]):
    """Emits parcel verification confirmation event."""
    project_id = parcel.get("project_id", "prj-nh704")
    parcel_id = parcel.get("id")

    payload = {
        "event": "parcel_verified",
        "message": f"Khasra No. {parcel['khasra_no']} verified by {parcel.get('verified_by', 'CALA Officer')}",
        "parcel": parcel
    }
    await sio.emit("parcel_verified", payload, room=f"project:{project_id}")
    await sio.emit("parcel_verified", payload, room=f"parcel:{parcel_id}")
    await sio.emit("parcel_verified", payload, room="national_dashboard")

async def broadcast_notification(notification: Dict[str, Any]):
    """Broadcasts statutory workflow notifications to national and state rooms."""
    await sio.emit("notification_created", notification, room="national_dashboard")

async def broadcast_payment_status_changed(payment: Dict[str, Any]):
    """
    Broadcasts real-time payment updates to:
    - the beneficiary landowner's personal room
    - the case/project room
    - the national dashboard
    """
    payload = {
        "event": "payment_status_changed",
        "payment": payment
    }
    beneficiary_id = payment.get("beneficiary_id")
    case_id = payment.get("case_id")
    parcel_id = payment.get("parcel_id")

    if beneficiary_id:
        await sio.emit("payment_status_changed", payload, room=f"user:{beneficiary_id}")
    if parcel_id:
        await sio.emit("payment_status_changed", payload, room=f"parcel:{parcel_id}")
    await sio.emit("payment_status_changed", payload, room="national_dashboard")

async def broadcast_compensation_approved(compensation: Dict[str, Any]):
    """
    Broadcasts compensation approval award declaration.
    """
    payload = {
        "event": "compensation_approved",
        "compensation": compensation
    }
    beneficiary_id = compensation.get("beneficiary_id")
    parcel_id = compensation.get("parcel_id")

    if beneficiary_id:
        await sio.emit("compensation_approved", payload, room=f"user:{beneficiary_id}")
    if parcel_id:
        await sio.emit("compensation_approved", payload, room=f"parcel:{parcel_id}")
    await sio.emit("compensation_approved", payload, room="national_dashboard")

