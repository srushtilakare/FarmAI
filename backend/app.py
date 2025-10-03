from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os
import sys

# Add ML folder to path so we can import predict.py
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ML_DIR = os.path.join(BASE_DIR, "ml")
sys.path.append(ML_DIR)

from predict import predict_image

app = Flask(__name__)

# Where uploaded images will be temporarily saved
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB limit

@app.route("/api/predict/tomato", methods=["POST"])
def predict_tomato():
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)

    try:
        disease, confidence = predict_image(file_path)
        response = {
            "disease": disease,
            "confidence": confidence / 100  # send as 0-1
        }
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        # Remove uploaded file after prediction
        if os.path.exists(file_path):
            os.remove(file_path)

    return jsonify(response)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
