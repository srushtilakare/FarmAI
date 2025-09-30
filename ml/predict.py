 # ml/predict.py
import tensorflow as tf
from tensorflow.keras.preprocessing import image
import numpy as np
import os
import json
import sys

# Load the trained model
MODEL_PATH = os.path.join(os.getcwd(), "ml", "models", "tomato_model.h5")
model = tf.keras.models.load_model(MODEL_PATH)

# Load class indices from JSON
CLASS_INDICES_PATH = os.path.join(os.getcwd(), "ml", "models", "class_indices.json")
with open(CLASS_INDICES_PATH, "r") as f:
    class_indices = json.load(f)

# Reverse mapping: index -> class name
CLASS_NAMES = [None] * len(class_indices)
for class_name, idx in class_indices.items():
    CLASS_NAMES[idx] = class_name

def predict_image(img_path):
    # Load and preprocess the image
    img = image.load_img(img_path, target_size=(224, 224))
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = img_array / 255.0  # Normalize

    # Make prediction
    preds = model.predict(img_array)
    class_idx = np.argmax(preds, axis=1)[0]
    confidence = float(preds[0][class_idx])

    return CLASS_NAMES[class_idx], round(confidence, 2)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)

    img_path = sys.argv[1]
    if not os.path.exists(img_path):
        print(json.dumps({"error": f"File not found: {img_path}"}))
        sys.exit(1)

    label, confidence = predict_image(img_path)
    # Output JSON for easy parsing
    print(json.dumps({"disease": label, "confidence": confidence}))
