from flask import Blueprint, jsonify
from datetime import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat()
    }), 200
