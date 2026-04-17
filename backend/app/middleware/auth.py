import os
from functools import wraps
from flask import request, g, jsonify
from supabase import create_client, Client
from app.config import Config
from clerk_backend_api import Clerk
import jwt # PyJWT
from jose import jwt as jose_jwt # using jose for easier JWKS handling if needed, but clerk-sdk handles user fetching

# Initialize Supabase clients (for database only)
if not Config.SUPABASE_URL or not Config.SUPABASE_ANON_KEY:
    raise ValueError("Missing Supabase configuration")

supabase: Client = create_client(Config.SUPABASE_URL, Config.SUPABASE_ANON_KEY)
supabase_admin: Client = create_client(Config.SUPABASE_URL, Config.SUPABASE_SERVICE_ROLE_KEY) if Config.SUPABASE_SERVICE_ROLE_KEY else supabase

# Initialize Clerk client
clerk_client = Clerk(bearer_auth=Config.CLERK_SECRET_KEY)

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # Let Flask-CORS handle preflight — no auth needed for OPTIONS
        if request.method == 'OPTIONS':
            return f(*args, **kwargs)

        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"success": False, "error": "Missing Bearer token", "code": 401}), 401

        session_token = auth_header.split(" ")[1]

        if not session_token or session_token in ("null", "undefined", ""):
            return jsonify({"success": False, "error": "Invalid token", "code": 401}), 401

        # --- JWT decode (auth failure = hard 401) ---
        try:
            # PyJWT 2.x requires key="" and algorithms even when skipping signature verification
            payload = jwt.decode(
                session_token,
                key="",
                algorithms=["RS256"],
                options={"verify_signature": False}
            )
            clerk_user_id = payload.get("sub")

            if not clerk_user_id:
                return jsonify({"success": False, "error": "Invalid token: missing sub claim", "code": 401}), 401

            g.user_id = clerk_user_id
            g.user_role = "user"  # safe default
            token_email = payload.get("email", "")

        except Exception as e:
            print(f"[auth] JWT decode failed: {e}")
            return jsonify({"success": False, "error": "Unauthorized: invalid token", "code": 401}), 401

        g.profile_id = None  # UUID in profiles table, used as FK in appointments

        # --- Profile sync (errors here must NOT block authenticated requests) ---
        try:
            # Look up by clerk_id first, fall back to email
            profile_resp = supabase_admin.table('profiles').select('id, role').eq('clerk_id', clerk_user_id).execute()

            if not profile_resp.data and token_email:
                profile_resp = supabase_admin.table('profiles').select('id, role').eq('email', token_email).execute()
                # Backfill clerk_id if found by email
                if profile_resp.data:
                    try:
                        supabase_admin.table('profiles').update({'clerk_id': clerk_user_id}).eq('id', profile_resp.data[0]['id']).execute()
                    except Exception:
                        pass

            if profile_resp.data:
                g.user_role = profile_resp.data[0].get('role', 'user')
                g.profile_id = profile_resp.data[0].get('id')
            else:
                # New user — fetch from Clerk and create profile
                try:
                    user = clerk_client.users.get(user_id=clerk_user_id)
                    email = user.email_addresses[0].email_address if user.email_addresses else token_email
                    name = f"{user.first_name or ''} {user.last_name or ''}".strip() or "User"
                    result = supabase_admin.table('profiles').upsert(
                        {"clerk_id": clerk_user_id, "email": email, "name": name, "role": "user"},
                        on_conflict="email"
                    ).execute()
                    if result.data:
                        g.profile_id = result.data[0].get('id')
                except Exception as sync_err:
                    print(f"[auth] Profile sync error: {sync_err}")

        except Exception as db_err:
            print(f"[auth] Profile lookup error: {db_err}")
            # User is authenticated — don't block, just default to 'user' role

        return f(*args, **kwargs)
    return decorated

def require_admin(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if getattr(g, 'user_role', 'user') != 'admin':
            return jsonify({"success": False, "error": "Forbidden: Admin access required", "code": 403}), 403
        return f(*args, **kwargs)
    return decorated
