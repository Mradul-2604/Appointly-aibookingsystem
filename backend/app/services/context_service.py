from app.middleware.auth import supabase_admin
import json

def get_context(user_id: str):
    """
    Retrieves the conversation context for a user.
    """
    resp = supabase_admin.table('conversation_context').select('*').eq('user_id', user_id).execute()
    if resp.data:
        return resp.data[0]
    else:
        # Create it safely
        new_ctx = {
            "user_id": user_id,
            "messages": [],
            "pending_data": {}
        }
        res = supabase_admin.table('conversation_context').insert(new_ctx).execute()
        return res.data[0] if res.data else new_ctx

def update_context(user_id: str, messages: list, pending_data: dict):
    """
    Updates the conversation context with new message history and pending booking logic.
    """
    supabase_admin.table('conversation_context').update({
        "messages": messages,
        "pending_data": pending_data
    }).eq('user_id', user_id).execute()

def append_to_history(user_id: str, new_messages: list):
    """
    Appends messages dynamically enforcing maximum of 20 elements
    """
    ctx = get_context(user_id)
    history = ctx.get("messages", [])
    history.extend(new_messages)
    
    # Prune history to limit size and stay in token limits
    if len(history) > 20:
         history = history[-20:]
         
    # update context
    supabase_admin.table('conversation_context').update({
        "messages": history
    }).eq('user_id', user_id).execute()
    return history
