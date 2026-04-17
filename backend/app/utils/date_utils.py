import datetime
import re

def parse_relative_date(date_str: str) -> str | None:
    """
    Tries to compute a real YYYY-MM-DD date out of standard relative expressions.
    Used as an extra validation guard or fallback. LLM should ideally do this,
    but this ensures safety.
    """
    if not date_str:
        return None
    
    date_str = date_str.lower().strip()
    today = datetime.date.today()
    
    if date_str == "today":
        return today.isoformat()
    elif date_str == "tomorrow":
        return (today + datetime.timedelta(days=1)).isoformat()
    
    # Very basic parsing, ideally the LLM returns YYYY-MM-DD specifically
    
    # Try parsing explicitly if it's already YYYY-MM-DD
    if re.match(r"^\d{4}-\d{2}-\d{2}$", date_str):
        return date_str
        
    return None

def parse_vague_time(time_str: str) -> str | None:
    if not time_str:
        return None
        
    time_str = time_str.lower().strip()
    if time_str == "morning":
        return "09:00"
    elif time_str == "afternoon":
        return "14:00"
    elif time_str == "evening":
        return "18:00"
        
    # Check if HH:MM matching
    if re.match(r"^\d{2}:\d{2}$", time_str):
        return time_str
    
    return None
