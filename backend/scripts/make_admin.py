import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Add parent directory to path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def make_admin(email: str):
    print(f"Promoting {email} to admin...")
    
    # Try to find the user
    res = supabase.table('profiles').select('id, name').eq('email', email).execute()
    
    if not res.data:
        print(f"User {email} not found in profiles table.")
        print("Please ask the user to sign up/sign in to the app first so their profile is created.")
        return

    profile = res.data[0]
    print(f"Found profile for {profile.get('name')} (ID: {profile.get('id')})")
    
    # Update role to admin
    update = supabase.table('profiles').update({'role': 'admin'}).eq('id', profile['id']).execute()
    
    if update.data:
        print(f"SUCCESS: {email} is now an admin!")
    else:
        print(f"Failed to update role for {email}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python make_admin.py <email>")
    else:
        make_admin(sys.argv[1])
