# ml/predict.py
import argparse
import tensorflow as tf
from tensorflow.keras.preprocessing import image
import numpy as np
import os, json, sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")

MODEL_PATH = os.path.join(MODEL_DIR, "tomato_model.h5")
model = tf.keras.models.load_model(MODEL_PATH)

CLASS_INDICES_PATH = os.path.join(MODEL_DIR, "class_indices.json")
with open(CLASS_INDICES_PATH, "r") as f:
    class_indices = json.load(f)

CLASS_NAMES = [None] * len(class_indices)
for class_name, idx in class_indices.items():
    CLASS_NAMES[idx] = class_name

def predict_image(img_path):
    img = image.load_img(img_path, target_size=(224, 224))
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0) / 255.0
    preds = model.predict(img_array)
    class_idx = np.argmax(preds, axis=1)[0]
    confidence = float(preds[0][class_idx])
    return CLASS_NAMES[class_idx], round(confidence * 100, 2)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", required=True, help="Path to input image")
    args = parser.parse_args()

    if not os.path.exists(args.image):
        print(json.dumps({"error": f"File not found: {args.image}"}))
        sys.exit(1)

    label, confidence = predict_image(args.image)
    print(json.dumps({"disease": label, "confidence": confidence}))
