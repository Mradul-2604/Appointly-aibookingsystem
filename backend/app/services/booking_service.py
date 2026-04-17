from app.middleware.auth import supabase_admin
from datetime import datetime, timedelta

APPOINTMENT_DURATION_MINUTES = 30
CLINIC_OPEN  = (10, 30)   # 10:30
CLINIC_CLOSE = (20,  0)   # last slot starts 20:00, ends 20:30


class BookingError(Exception):
    def __init__(self, message, code=400):
        self.message = message
        self.code = code
        super().__init__(self.message)


def _normalise_time(t: str) -> str:
    """Ensure time is HH:MM:SS for consistent Postgres time comparisons."""
    return t + ":00" if len(t) == 5 else t


def check_slot_availability(date: str, time: str) -> dict:
    """
    Returns {"available": True} or {"available": False, "suggested_time": "HH:MM"}.
    Walks forward in 30-min increments within clinic hours to find the next free slot.
    """
    start_full = _normalise_time(time)
    start_dt = datetime.strptime(f"{date} {start_full}", '%Y-%m-%d %H:%M:%S')
    end_dt = start_dt + timedelta(minutes=APPOINTMENT_DURATION_MINUTES)
    end_full = end_dt.strftime('%H:%M:%S')

    case_a = supabase_admin.table('slots').select('id, is_available') \
        .eq('date', date).gte('start_time', start_full).lt('start_time', end_full).execute()
    case_b = supabase_admin.table('slots').select('id, is_available') \
        .eq('date', date).lte('start_time', start_full).gt('end_time', start_full).execute()

    overlapping = (case_a.data or []) + (case_b.data or [])
    conflict = any(not s['is_available'] for s in overlapping)

    if not conflict:
        return {"available": True}

    # Find next free slot within clinic hours on the same day
    clinic_close_dt = start_dt.replace(hour=CLINIC_CLOSE[0], minute=CLINIC_CLOSE[1], second=0)
    candidate = start_dt + timedelta(minutes=APPOINTMENT_DURATION_MINUTES)

    while candidate <= clinic_close_dt:
        cand_full = candidate.strftime('%H:%M:%S')
        cand_end  = (candidate + timedelta(minutes=APPOINTMENT_DURATION_MINUTES)).strftime('%H:%M:%S')

        ca = supabase_admin.table('slots').select('id, is_available') \
            .eq('date', date).gte('start_time', cand_full).lt('start_time', cand_end).execute()
        cb = supabase_admin.table('slots').select('id, is_available') \
            .eq('date', date).lte('start_time', cand_full).gt('end_time', cand_full).execute()

        if not any(not s['is_available'] for s in (ca.data or []) + (cb.data or [])):
            return {"available": False, "suggested_time": candidate.strftime('%H:%M')}

        candidate += timedelta(minutes=APPOINTMENT_DURATION_MINUTES)

    return {"available": False, "suggested_time": None}


def find_service_by_name(name: str) -> dict:
    """Case-insensitive lookup — exact match first, then partial."""
    resp = supabase_admin.table('services').select('*') \
        .ilike('name', name).eq('is_active', True).execute()
    if not resp.data:
        resp = supabase_admin.table('services').select('*') \
            .ilike('name', f'%{name}%').eq('is_active', True).execute()
    if not resp.data:
        raise BookingError(
            f"Reason for visit '{name}' not recognised. Please describe your concern differently.",
            404
        )
    return resp.data[0]


def find_or_create_slot(date: str, start_time: str) -> dict:
    """
    Return an available 30-minute slot for the given date+time.
    Raises BookingError(409) if any appointment already occupies that window.
    No two appointments can overlap — the whole 30-minute block is exclusive.
    """
    start_full = _normalise_time(start_time)
    start_dt = datetime.strptime(f"{date} {start_full}", '%Y-%m-%d %H:%M:%S')
    end_dt = start_dt + timedelta(minutes=APPOINTMENT_DURATION_MINUTES)
    end_full = end_dt.strftime('%H:%M:%S')

    # Case A: an existing slot whose start falls inside our [start, end) window
    case_a = supabase_admin.table('slots').select('id, start_time, end_time, is_available') \
        .eq('date', date) \
        .gte('start_time', start_full) \
        .lt('start_time', end_full) \
        .execute()

    # Case B: our start falls inside an existing slot [slot_start, slot_end)
    case_b = supabase_admin.table('slots').select('id, start_time, end_time, is_available') \
        .eq('date', date) \
        .lte('start_time', start_full) \
        .gt('end_time', start_full) \
        .execute()

    overlapping = (case_a.data or []) + (case_b.data or [])

    for slot in overlapping:
        if not slot['is_available']:
            raise BookingError(
                f"That time slot is already booked. Appointments are {APPOINTMENT_DURATION_MINUTES} minutes — "
                f"please choose a time at least {APPOINTMENT_DURATION_MINUTES} minutes away.",
                409
            )
        # Available slot already exists in this window — reuse it
        return slot

    # No conflict — create a fresh 30-minute slot
    created = supabase_admin.table('slots').insert({
        "date": date,
        "start_time": start_full,
        "end_time": end_full,
        "is_available": True,
    }).execute()

    if not created.data:
        raise BookingError("Failed to create appointment slot.", 500)
    return created.data[0]


def confirm_booking_from_chat(user_id: str, date: str, time: str, service_name: str, notes: str = None) -> dict:
    """
    Called when the patient clicks Confirm in the chat UI.
    Resolves the reason-for-visit (service) and time slot, then creates the appointment.
    """
    try:
        appt_dt = datetime.strptime(f"{date} {time}", '%Y-%m-%d %H:%M')
    except ValueError:
        raise BookingError("Invalid date or time format.", 400)

    if appt_dt < datetime.now():
        raise BookingError("Cannot book appointments in the past.", 400)

    # Closed on Sundays (weekday() == 6)
    if appt_dt.weekday() == 6:
        raise BookingError("The clinic is closed on Sundays. Please choose a Monday–Saturday date.", 400)

    # Clinic hours: 10:30–20:30
    clinic_open  = appt_dt.replace(hour=10, minute=30, second=0)
    clinic_close = appt_dt.replace(hour=20, minute=30, second=0)
    if appt_dt < clinic_open or appt_dt >= clinic_close:
        raise BookingError("The clinic is open 10:30 AM – 8:30 PM, Monday to Saturday.", 400)

    # Last slot must start by 20:00 so it ends by 20:30
    last_slot = appt_dt.replace(hour=20, minute=0, second=0)
    if appt_dt > last_slot:
        raise BookingError("The last appointment slot starts at 8:00 PM. Please choose an earlier time.", 400)

    service = find_service_by_name(service_name)
    slot = find_or_create_slot(date, time)
    return create_appointment(user_id, slot['id'], service['id'], notes)


def create_appointment(user_id: str, slot_id: str, service_id: str, notes: str = None):
    slot_resp = supabase_admin.table('slots').select('*').eq('id', slot_id).execute()
    if not slot_resp.data:
        raise BookingError("Slot not found", 404)

    slot = slot_resp.data[0]

    slot_dt = datetime.strptime(f"{slot['date']} {slot['start_time']}", '%Y-%m-%d %H:%M:%S')
    if slot_dt < datetime.now():
        raise BookingError("Cannot book appointments in the past", 400)

    if not slot['is_available']:
        raise BookingError("This slot is no longer available", 409)

    supabase_admin.table('slots').update({"is_available": False}).eq('id', slot_id).execute()

    appt_res = supabase_admin.table('appointments').insert({
        "user_id": user_id,
        "slot_id": slot_id,
        "service_id": service_id,
        "status": "confirmed",
        "notes": notes,
    }).execute()
    return appt_res.data[0]


def get_upcoming_appointments(user_id: str) -> list:
    """Return upcoming confirmed/rescheduled appointments for a user, sorted by date/time."""
    res = supabase_admin.table('appointments') \
        .select('id, status, notes, slots(id, date, start_time, end_time), services(name)') \
        .eq('user_id', user_id) \
        .in_('status', ['confirmed', 'rescheduled']) \
        .execute()
    now = datetime.now()
    upcoming = []
    for a in (res.data or []):
        slot = a.get('slots') or {}
        if slot.get('date') and slot.get('start_time'):
            try:
                appt_dt = datetime.strptime(f"{slot['date']} {slot['start_time']}", '%Y-%m-%d %H:%M:%S')
                if appt_dt >= now:
                    upcoming.append(a)
            except Exception:
                pass
    return sorted(upcoming, key=lambda a: (a['slots']['date'], a['slots']['start_time']))


def find_appointment_for_action(user_id: str, date: str = None, service_name: str = None) -> dict:
    """Find the most relevant upcoming appointment for cancel/reschedule actions."""
    upcoming = get_upcoming_appointments(user_id)
    if not upcoming:
        raise BookingError("You don't have any upcoming appointments.", 404)
    if date:
        filtered = [a for a in upcoming if (a.get('slots') or {}).get('date') == date]
        if filtered:
            upcoming = filtered
    if service_name:
        filtered = [a for a in upcoming
                    if (a.get('services') or {}).get('name', '').lower() == service_name.lower()]
        if filtered:
            upcoming = filtered
    return upcoming[0]


def confirm_reschedule_from_chat(user_id: str, appointment_id: str, new_date: str, new_time: str) -> dict:
    """Free the old slot and book a new one for an existing appointment."""
    appt_res = supabase_admin.table('appointments').select('*, slots(*)') \
        .eq('id', appointment_id).eq('user_id', user_id).execute()
    if not appt_res.data:
        raise BookingError("Appointment not found.", 404)

    appt = appt_res.data[0]
    if appt['status'] == 'cancelled':
        raise BookingError("Cannot reschedule a cancelled appointment.", 400)

    try:
        new_dt = datetime.strptime(f"{new_date} {new_time}", '%Y-%m-%d %H:%M')
    except ValueError:
        raise BookingError("Invalid date or time format.", 400)

    if new_dt < datetime.now():
        raise BookingError("Cannot reschedule to a past time.", 400)
    if new_dt.weekday() == 6:
        raise BookingError("The clinic is closed on Sundays.", 400)

    clinic_open  = new_dt.replace(hour=10, minute=30, second=0)
    clinic_close = new_dt.replace(hour=20, minute=0,  second=0)
    if new_dt < clinic_open or new_dt > clinic_close:
        raise BookingError("The clinic is open 10:30 AM – 8:00 PM, Monday to Saturday.", 400)

    new_slot = find_or_create_slot(new_date, new_time)

    supabase_admin.table('slots').update({"is_available": True}).eq('id', appt['slot_id']).execute()
    supabase_admin.table('slots').update({"is_available": False}).eq('id', new_slot['id']).execute()

    res = supabase_admin.table('appointments').update({
        "slot_id": new_slot['id'], "status": "rescheduled"
    }).eq('id', appointment_id).execute()
    return res.data[0]


def cancel_appointment(user_id: str, appointment_id: str):
    appt_res = supabase_admin.table('appointments').select('*') \
        .eq('id', appointment_id).eq('user_id', user_id).execute()
    if not appt_res.data:
        raise BookingError("Appointment not found", 404)

    appt = appt_res.data[0]
    if appt['status'] == 'cancelled':
        raise BookingError("Appointment is already cancelled", 400)

    supabase_admin.table('slots').update({"is_available": True}).eq('id', appt['slot_id']).execute()
    res = supabase_admin.table('appointments').update({"status": "cancelled"}).eq('id', appointment_id).execute()
    return res.data[0]


def reschedule_appointment(user_id: str, appointment_id: str, new_slot_id: str):
    appt_res = supabase_admin.table('appointments').select('*') \
        .eq('id', appointment_id).eq('user_id', user_id).execute()
    if not appt_res.data:
        raise BookingError("Appointment not found", 404)

    appt = appt_res.data[0]
    if appt['status'] == 'cancelled':
        raise BookingError("Cannot reschedule a cancelled appointment", 400)

    new_slot_resp = supabase_admin.table('slots').select('*').eq('id', new_slot_id).execute()
    if not new_slot_resp.data:
        raise BookingError("New slot not found", 404)
    if not new_slot_resp.data[0]['is_available']:
        raise BookingError("This new slot is no longer available", 409)

    supabase_admin.table('slots').update({"is_available": True}).eq('id', appt['slot_id']).execute()
    supabase_admin.table('slots').update({"is_available": False}).eq('id', new_slot_id).execute()
    res = supabase_admin.table('appointments').update({
        "slot_id": new_slot_id, "status": "rescheduled"
    }).eq('id', appointment_id).execute()
    return res.data[0]


# ── Admin-only helpers ────────────────────────────────────────────────────────

def block_time_slot(date: str, start_time: str) -> dict:
    """Mark a time slot as unavailable (admin unavailability block)."""
    start_full = _normalise_time(start_time)
    start_dt   = datetime.strptime(f"{date} {start_full}", '%Y-%m-%d %H:%M:%S')
    end_full   = (start_dt + timedelta(minutes=APPOINTMENT_DURATION_MINUTES)).strftime('%H:%M:%S')

    existing = supabase_admin.table('slots').select('id, is_available') \
        .eq('date', date).eq('start_time', start_full).execute()

    if existing.data:
        slot = existing.data[0]
        if not slot['is_available']:
            raise BookingError("This time slot is already blocked or booked.", 409)
        supabase_admin.table('slots').update({"is_available": False}).eq('id', slot['id']).execute()
        return {**slot, 'is_available': False}

    res = supabase_admin.table('slots').insert({
        "date": date, "start_time": start_full,
        "end_time": end_full, "is_available": False,
    }).execute()
    if not res.data:
        raise BookingError("Failed to block slot.", 500)
    return res.data[0]


def unblock_time_slot(slot_id: str) -> bool:
    """Delete an admin-blocked slot (must have no active appointment)."""
    appt = supabase_admin.table('appointments').select('id') \
        .eq('slot_id', slot_id).neq('status', 'cancelled').execute()
    if appt.data:
        raise BookingError("This slot has an active booking — cancel it first.", 409)
    supabase_admin.table('slots').delete().eq('id', slot_id).execute()
    return True


def cancel_appointment_admin(appointment_id: str) -> dict:
    """Cancel any appointment (admin — no user_id check). Returns full row for email."""
    res = supabase_admin.table('appointments') \
        .select('*, slots(*), services(*), profiles(name, email)') \
        .eq('id', appointment_id).execute()
    if not res.data:
        raise BookingError("Appointment not found.", 404)

    appt = res.data[0]
    if appt['status'] == 'cancelled':
        raise BookingError("Appointment is already cancelled.", 400)

    supabase_admin.table('slots').update({"is_available": True}).eq('id', appt['slot_id']).execute()
    supabase_admin.table('appointments').update({"status": "cancelled"}).eq('id', appointment_id).execute()
    return appt
