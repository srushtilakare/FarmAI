import json
import os
from flask import Flask, request, jsonify
import tensorflow as tf
from tensorflow.keras.preprocessing import image # type: ignore
import numpy as np
from flask_cors import CORS

# Flask app
app = Flask(__name__)
CORS(app)

# Model path
MODEL_PATH = os.path.join("models", "tomato_model.h5")
CLASS_INDICES_PATH = os.path.join("models", "class_indices.json")

# Load model
model = tf.keras.models.load_model(MODEL_PATH)

# Load class indices
with open(CLASS_INDICES_PATH, "r") as f:
    class_indices = json.load(f)

# Invert dictionary to get index -> class mapping
CLASS_NAMES = {v: k for k, v in class_indices.items()}

# Predict function
def predict_image(img_path):
    img = image.load_img(img_path, target_size=(224, 224))  # Adjust size to your model
    x = image.img_to_array(img)
    x = np.expand_dims(x, axis=0)
    x = x / 255.0  # Normalize if your model expects normalized input

    preds = model.predict(x)
    predicted_class_index = np.argmax(preds[0])
    predicted_class_name = CLASS_NAMES[predicted_class_index]
    confidence = float(preds[0][predicted_class_index] * 100)

    # Optional: simple severity logic
    severity = "None" if predicted_class_name.lower() == "healthy" else ("High" if confidence > 85 else "Moderate")

    return {
        "disease": predicted_class_name,
        "confidence": confidence,
        "severity": severity
    }

# Routes
@app.route("/predict/tomato", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    # Save uploaded image temporarily
    upload_path = os.path.join("uploads", file.filename)
    os.makedirs("uploads", exist_ok=True)
    file.save(upload_path)

    # Make prediction
    try:
        result = predict_image(upload_path)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        # Remove temporary file
        if os.path.exists(upload_path):
            os.remove(upload_path)

# Run server
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
