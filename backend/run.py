from app import create_app
from app.config import Config

from flask_cors import CORS

app = create_app()
CORS(app, resources={r"/*": {"origins": Config.ALLOWED_ORIGINS}}, supports_credentials=True)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(Config.PORT), debug=(Config.FLASK_ENV == "development"))
