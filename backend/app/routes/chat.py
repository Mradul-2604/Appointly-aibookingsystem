import traceback
from flask import Blueprint, request, jsonify, g
from app.middleware.auth import require_auth
from app.services.llm_service import generate_chat_response
from app.services.context_service import get_context, append_to_history
from app.services.booking_service import (
    check_slot_availability, find_appointment_for_action,
    get_upcoming_appointments, BookingError
)
from app.limiter import limiter

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('', methods=['POST'])
@require_auth
@limiter.limit("20 per minute", error_message="Too many requests", key_func=lambda: g.user_id)
def handle_chat():
    data = request.json
    if not data or 'message' not in data:
        return jsonify({"success": False, "error": "Message is required", "code": 422}), 422

    user_message = data['message']
    user_id = g.profile_id or g.user_id

    try:
        ctx = get_context(user_id)
        history = ctx.get('messages', [])

        formatted_message = {"role": "user", "content": user_message}
        history.append(formatted_message)

        llm_resp = generate_chat_response(user_message, history)

        ext = llm_resp.get("extracted", {}) or {}
        intent = llm_resp.get("intent")
        reply = llm_resp.get("reply")
        booking_ready = False
        cancel_ready = False
        reschedule_ready = False
        appointment_id = None

        if intent == "book":
            all_fields = ext.get("date") and ext.get("time") and ext.get("service")
            if all_fields:
                avail = check_slot_availability(ext["date"], ext["time"])
                if avail["available"]:
                    booking_ready = True
                else:
                    suggested = avail.get("suggested_time")
                    if suggested:
                        reply = (
                            f"Unfortunately {ext['time']} on {ext['date']} is already taken. "
                            f"The next available slot is at {suggested} — would you like me to book that instead?"
                        )
                        ext = {**ext, "time": suggested}
                    else:
                        reply = (
                            f"Unfortunately there are no more available slots on {ext['date']}. "
                            f"Would you like to try a different day?"
                        )
                        ext = {**ext, "time": None}

        elif intent == "cancel":
            try:
                appt = find_appointment_for_action(user_id, ext.get("date"), ext.get("service"))
                slot = appt.get("slots") or {}
                svc  = appt.get("services") or {}
                cancel_ready = True
                appointment_id = appt["id"]
                reply = (
                    f"I can cancel your {svc.get('name', 'appointment')} on "
                    f"{slot.get('date')} at {(slot.get('start_time') or '')[:5]}. "
                    f"Please click the button below to confirm the cancellation."
                )
            except BookingError as e:
                reply = e.message
            except Exception:
                pass

        elif intent == "reschedule":
            all_new_fields = ext.get("date") and ext.get("time")
            if all_new_fields:
                try:
                    appt = find_appointment_for_action(user_id, None, ext.get("service"))
                    avail = check_slot_availability(ext["date"], ext["time"])
                    if avail["available"]:
                        reschedule_ready = True
                        appointment_id = appt["id"]
                    else:
                        suggested = avail.get("suggested_time")
                        if suggested:
                            reply = (
                                f"Unfortunately {ext['time']} on {ext['date']} is already taken. "
                                f"The next available slot is at {suggested} — would you like to reschedule to that instead?"
                            )
                            ext = {**ext, "time": suggested}
                        else:
                            reply = (
                                f"Unfortunately there are no available slots on {ext['date']}. "
                                f"Would you like to try a different day?"
                            )
                            ext = {**ext, "time": None}
                except BookingError as e:
                    reply = e.message
                except Exception:
                    pass

        elif intent == "query":
            try:
                appointments = get_upcoming_appointments(user_id)
                if appointments:
                    parts = []
                    for a in appointments:
                        slot = a.get("slots") or {}
                        svc  = a.get("services") or {}
                        parts.append(
                            f"{svc.get('name', 'Appointment')} on {slot.get('date')} "
                            f"at {(slot.get('start_time') or '')[:5]}"
                        )
                    reply = "Your upcoming appointment(s): " + "; ".join(parts) + "."
                else:
                    reply = "You don't have any upcoming appointments booked."
            except Exception:
                pass

        # Save the final reply (post-correction) to history
        formatted_assistant = {"role": "assistant", "content": reply or "..."}
        append_to_history(user_id, [formatted_message, formatted_assistant])

        resp_data = {
            "reply": reply,
            "intent": intent,
            "extracted": ext,
            "booking_ready": booking_ready,
            "cancel_ready": cancel_ready,
            "reschedule_ready": reschedule_ready,
            "appointment_id": appointment_id,
            "context_updated": True
        }

        return jsonify({"success": True, "data": resp_data}), 200

    except Exception as e:
        print(f"[chat] 503 error — type={type(e).__name__} msg={e}")
        traceback.print_exc()
        return jsonify({"success": False, "error": "Service Unavailable. LLM failure.", "code": 503}), 503
