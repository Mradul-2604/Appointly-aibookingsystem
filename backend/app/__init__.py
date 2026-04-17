from flask import Flask, jsonify
from flask_cors import CORS
from app.config import Config
from app.limiter import limiter

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Configure CORS - accessible dynamically via Config in prod
    CORS(app, resources={r"/*": {
        "origins": ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"]
    }}, supports_credentials=True, methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

    limiter.init_app(app)

    # Load Routes
    from app.routes.auth import auth_bp
    from app.routes.admin import admin_bp
    from app.routes.booking import booking_bp
    from app.routes.chat import chat_bp

    app.register_blueprint(auth_bp, url_prefix='/')
    app.register_blueprint(admin_bp, url_prefix='/admin')
    app.register_blueprint(booking_bp, url_prefix='/api')
    app.register_blueprint(chat_bp, url_prefix='/chat')

    @app.errorhandler(429)
    def ratelimit_handler(e):
        return jsonify({"success": False, "error": "Too many requests", "retry_after": 60, "code": 429}), 429
        
    @app.errorhandler(Exception)
    def generic_handler(e):
        # Fallback to prevent raw crash traces going to clients
        return jsonify({"success": False, "error": "An unexpected server error occurred", "code": 500}), 500

    return app
