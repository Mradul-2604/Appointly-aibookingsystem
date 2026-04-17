from typing import Optional, Any
from pydantic import BaseModel, Field

# --- Request Schemas ---

class ChatRequest(BaseModel):
    message: str

class BookRequest(BaseModel):
    slot_id: str
    service_id: str
    notes: Optional[str] = None

class RescheduleRequest(BaseModel):
    appointment_id: str
    new_slot_id: str

class CancelRequest(BaseModel):
    appointment_id: str

class SlotCreateRequest(BaseModel):
    date: str       # YYYY-MM-DD
    start_time: str # HH:MM
    end_time: str   # HH:MM
    service_id: str

class SlotUpdateRequest(BaseModel):
    is_available: bool

class AppointmentStatusUpdateRequest(BaseModel):
    status: str # 'confirmed' | 'cancelled'
