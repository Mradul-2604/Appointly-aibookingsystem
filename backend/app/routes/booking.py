from flask import Blueprint, request, jsonify, g
from app.middleware.auth import require_auth, require_admin, supabase_admin
from app.services.booking_service import (
    create_appointment, reschedule_appointment, cancel_appointment,
    confirm_booking_from_chat, confirm_reschedule_from_chat, BookingError,
    block_time_slot, unblock_time_slot, cancel_appointment_admin,
)
from app.services.email_service import (
    send_booking_confirmation, send_cancellation_confirmation,
    send_reschedule_confirmation, send_admin_cancellation
)


def _get_profile(profile_id):
    """Fetch name and email for a profile UUID."""
    try:
        res = supabase_admin.table('profiles').select('name, email').eq('id', profile_id).single().execute()
        return res.data or {}
    except Exception:
        return {}

booking_bp = Blueprint('booking', __name__)

@booking_bp.route('/appointments', methods=['GET'])
@require_auth
def get_appointments():
    status = request.args.get('status')
    date = request.args.get('date')
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    offset = (page - 1) * limit
    
    query = supabase_admin.table('appointments').select('*, slots(*), services(*), profiles(name, email)')

    if getattr(g, 'user_role', 'user') != 'admin':
        if g.profile_id:
            query = query.eq('user_id', g.profile_id)
        else:
            return jsonify({"success": True, "data": []})
        
    if status:
        query = query.eq('status', status)
        
    # Date filtering usually requires joining against slots cleanly or processing post fetch
    
    try:
        res = query.range(offset, offset + limit - 1).execute()
        data = res.data
        if date: # rudimentary filter
            data = [d for d in data if d.get('slots', {}).get('date') == date]
            
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e), "code": 400}), 400

@booking_bp.route('/slots', methods=['GET'])
@require_auth
def get_slots():
    date = request.args.get('date')
    service_id = request.args.get('service_id')
    
    query = supabase_admin.table('slots').select('*').eq('is_available', True)
    if date:
        query = query.eq('date', date)
    if service_id:
        query = query.eq('service_id', service_id)
        
    try:
        res = query.execute()
        return jsonify({"success": True, "data": res.data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e), "code": 400}), 400

@booking_bp.route('/services', methods=['GET'])
@require_auth
def list_services():
    try:
        res = supabase_admin.table('services').select('*').eq('is_active', True).order('name').execute()
        return jsonify({"success": True, "data": res.data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e), "code": 500}), 500


@booking_bp.route('/confirm-booking', methods=['POST'])
@require_auth
def confirm_booking():
    data = request.json
    if not g.profile_id:
        return jsonify({"success": False, "error": "User profile not found. Please sign out and back in.", "code": 404}), 404
    try:
        appt = confirm_booking_from_chat(
            user_id=g.profile_id,
            date=data['date'],
            time=data['time'],
            service_name=data['service'],
            notes=data.get('notes'),
        )
        profile = _get_profile(g.profile_id)
        send_booking_confirmation(
            to_email=profile.get('email', ''),
            name=profile.get('name', 'there'),
            service=data['service'],
            date=data['date'],
            time=data['time'],
        )
        return jsonify({"success": True, "data": appt, "message": "Booking confirmed!"}), 201
    except BookingError as e:
        return jsonify({"success": False, "error": e.message, "code": e.code}), e.code
    except Exception as e:
        import traceback; traceback.print_exc()
        return jsonify({"success": False, "error": "Internal error", "code": 500}), 500


@booking_bp.route('/book', methods=['POST'])
@require_auth
def book():
    data = request.json
    try:
        if not g.profile_id:
            return jsonify({"success": False, "error": "User profile not found. Please try again.", "code": 404}), 404
        appt = create_appointment(
            user_id=g.profile_id,
            slot_id=data['slot_id'],
            service_id=data['service_id'],
            notes=data.get('notes')
        )
        return jsonify({"success": True, "data": appt, "message": "Booking successful"}), 201
    except BookingError as e:
        return jsonify({"success": False, "error": e.message, "code": e.code}), e.code
    except Exception as e:
        return jsonify({"success": False, "error": "Internal error", "code": 500}), 500

@booking_bp.route('/confirm-cancel', methods=['POST'])
@require_auth
def confirm_cancel():
    data = request.json or {}
    appointment_id = data.get('appointment_id')
    if not appointment_id:
        return jsonify({"success": False, "error": "appointment_id required", "code": 422}), 422
    try:
        appt = cancel_appointment(
            user_id=g.profile_id or g.user_id,
            appointment_id=appointment_id
        )
        # Fetch slot/service details for email
        try:
            detail = supabase_admin.table('appointments').select('slots(date,start_time), services(name)') \
                .eq('id', appointment_id).single().execute()
            slot = (detail.data or {}).get('slots') or {}
            svc  = (detail.data or {}).get('services') or {}
            profile = _get_profile(g.profile_id or g.user_id)
            send_cancellation_confirmation(
                to_email=profile.get('email', ''),
                name=profile.get('name', 'there'),
                service=svc.get('name', 'Appointment'),
                date=slot.get('date', ''),
                time=(slot.get('start_time') or '')[:5],
            )
        except Exception:
            pass
        return jsonify({"success": True, "data": appt, "message": "Appointment cancelled."}), 200
    except BookingError as e:
        return jsonify({"success": False, "error": e.message, "code": e.code}), e.code
    except Exception as e:
        return jsonify({"success": False, "error": "Internal error", "code": 500}), 500


@booking_bp.route('/confirm-reschedule', methods=['POST'])
@require_auth
def confirm_reschedule_chat():
    data = request.json or {}
    appointment_id = data.get('appointment_id')
    new_date = data.get('date')
    new_time = data.get('time')
    if not all([appointment_id, new_date, new_time]):
        return jsonify({"success": False, "error": "appointment_id, date, and time are required", "code": 422}), 422
    try:
        appt = confirm_reschedule_from_chat(
            user_id=g.profile_id or g.user_id,
            appointment_id=appointment_id,
            new_date=new_date,
            new_time=new_time,
        )
        try:
            detail = supabase_admin.table('appointments').select('services(name)') \
                .eq('id', appointment_id).single().execute()
            svc = ((detail.data or {}).get('services') or {})
            profile = _get_profile(g.profile_id or g.user_id)
            send_reschedule_confirmation(
                to_email=profile.get('email', ''),
                name=profile.get('name', 'there'),
                service=svc.get('name', 'Appointment'),
                new_date=new_date,
                new_time=new_time,
            )
        except Exception:
            pass
        return jsonify({"success": True, "data": appt, "message": "Appointment rescheduled."}), 200
    except BookingError as e:
        return jsonify({"success": False, "error": e.message, "code": e.code}), e.code
    except Exception as e:
        import traceback; traceback.print_exc()
        return jsonify({"success": False, "error": "Internal error", "code": 500}), 500


@booking_bp.route('/reschedule', methods=['POST'])
@require_auth
def reschedule():
    data = request.json
    try:
        appt = reschedule_appointment(
            user_id=g.profile_id or g.user_id,
            appointment_id=data['appointment_id'],
            new_slot_id=data['new_slot_id']
        )
        return jsonify({"success": True, "data": appt, "message": "Rescheduled successfully"}), 200
    except BookingError as e:
        return jsonify({"success": False, "error": e.message, "code": e.code}), e.code
    except Exception as e:
        return jsonify({"success": False, "error": "Internal error", "code": 500}), 500

@booking_bp.route('/cancel', methods=['POST'])
@require_auth
def cancel():
    data = request.json
    try:
        appt = cancel_appointment(
            user_id=g.profile_id or g.user_id,
            appointment_id=data['appointment_id']
        )
        return jsonify({"success": True, "data": appt, "message": "Cancellation successful"}), 200
    except BookingError as e:
        return jsonify({"success": False, "error": e.message, "code": e.code}), e.code
    except Exception as e:
        return jsonify({"success": False, "error": "Internal error", "code": 500}), 500


# ── Admin endpoints ───────────────────────────────────────────────────────────

@booking_bp.route('/admin/cancel-appointment', methods=['POST'])
@require_auth
@require_admin
def admin_cancel_appointment():
    data = request.json or {}
    appointment_id = data.get('appointment_id')
    if not appointment_id:
        return jsonify({"success": False, "error": "appointment_id required", "code": 422}), 422
    try:
        appt = cancel_appointment_admin(appointment_id)
        try:
            profile = appt.get('profiles') or {}
            slot    = appt.get('slots')    or {}
            svc     = appt.get('services') or {}
            if profile.get('email'):
                send_admin_cancellation(
                    to_email=profile['email'],
                    name=profile.get('name', 'there'),
                    service=svc.get('name', 'Appointment'),
                    date=slot.get('date', ''),
                    time=(slot.get('start_time') or '')[:5],
                )
        except Exception:
            pass
        return jsonify({"success": True, "data": appt, "message": "Appointment cancelled."}), 200
    except BookingError as e:
        return jsonify({"success": False, "error": e.message, "code": e.code}), e.code
    except Exception as e:
        import traceback; traceback.print_exc()
        return jsonify({"success": False, "error": "Internal error", "code": 500}), 500


@booking_bp.route('/admin/block-slot', methods=['POST'])
@require_auth
@require_admin
def admin_block_slot():
    data = request.json or {}
    date = data.get('date')
    time = data.get('time')
    if not date or not time:
        return jsonify({"success": False, "error": "date and time required", "code": 422}), 422
    try:
        slot = block_time_slot(date, time)
        return jsonify({"success": True, "data": slot}), 201
    except BookingError as e:
        return jsonify({"success": False, "error": e.message, "code": e.code}), e.code
    except Exception as e:
        return jsonify({"success": False, "error": "Internal error", "code": 500}), 500


@booking_bp.route('/admin/block-slot/<slot_id>', methods=['DELETE'])
@require_auth
@require_admin
def admin_unblock_slot(slot_id):
    try:
        unblock_time_slot(slot_id)
        return jsonify({"success": True}), 200
    except BookingError as e:
        return jsonify({"success": False, "error": e.message, "code": e.code}), e.code
    except Exception as e:
        return jsonify({"success": False, "error": "Internal error", "code": 500}), 500


@booking_bp.route('/admin/blocked-slots', methods=['GET'])
@require_auth
@require_admin
def admin_get_blocked_slots():
    date = request.args.get('date')
    query = supabase_admin.table('slots').select('id, date, start_time, end_time').eq('is_available', False)
    if date:
        query = query.eq('date', date)
    res = query.execute()
    slots = res.data or []
    if slots:
        ids = [s['id'] for s in slots]
        booked = supabase_admin.table('appointments').select('slot_id') \
            .in_('slot_id', ids).neq('status', 'cancelled').execute()
        booked_ids = {a['slot_id'] for a in (booked.data or [])}
        slots = [s for s in slots if s['id'] not in booked_ids]
    return jsonify({"success": True, "data": slots}), 200
