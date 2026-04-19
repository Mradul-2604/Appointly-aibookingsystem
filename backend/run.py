from app import create_app
from app.config import Config

from flask_cors import CORS

app = create_app()

# Allow all origins for production connectivity
CORS(app, resources={r"/*": {"origins": "*"}})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(Config.PORT), debug=(Config.FLASK_ENV == "development"))
