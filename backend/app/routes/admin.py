from flask import Blueprint, request, jsonify, g
from app.middleware.auth import require_auth, require_admin, supabase_admin

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/slots', methods=['POST'])
@require_auth
@require_admin
def create_slot():
    data = request.json
    try:
        res = supabase_admin.table('slots').insert({
            "date": data['date'],
            "start_time": data['start_time'],
            "end_time": data['end_time'],
            "service_id": data['service_id']
        }).execute()
        return jsonify({"success": True, "data": res.data[0], "message": "Slot created"}), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e), "code": 400}), 400

@admin_bp.route('/slots/<slot_id>', methods=['DELETE'])
@require_auth
@require_admin
def delete_slot(slot_id):
    try:
        supabase_admin.table('slots').delete().eq('id', slot_id).execute()
        return jsonify({"success": True, "data": None, "message": "Slot deleted"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e), "code": 400}), 400

@admin_bp.route('/slots/<slot_id>', methods=['PATCH'])
@require_auth
@require_admin
def update_slot(slot_id):
    data = request.json
    try:
        res = supabase_admin.table('slots').update({"is_available": data['is_available']}).eq('id', slot_id).execute()
        return jsonify({"success": True, "data": res.data[0] if res.data else None, "message": "Slot updated"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e), "code": 400}), 400

@admin_bp.route('/appointments/<id>/status', methods=['PATCH'])
@require_auth
@require_admin
def update_appointment_status(id):
    data = request.json
    try:
        res = supabase_admin.table('appointments').update({"status": data['status']}).eq('id', id).execute()
        return jsonify({"success": True, "data": res.data[0] if res.data else None, "message": "Appointment status updated"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e), "code": 400}), 400
