import json
import os
import sys
import argparse
import tensorflow as tf
from tensorflow.keras.preprocessing import image # type: ignore
import numpy as np

# Parse command line arguments
parser = argparse.ArgumentParser()
parser.add_argument("--image", type=str, help="Path to image file")
parser.add_argument("--crop", type=str, default="tomato", help="Crop type (tomato, potato, etc.)")
args = parser.parse_args()

# Determine model and class indices paths based on crop
# Get the directory where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
crop = args.crop.lower()
MODEL_PATH = os.path.join(SCRIPT_DIR, "models", f"{crop}_model.h5")
CLASS_INDICES_PATH = os.path.join(SCRIPT_DIR, "models", f"{crop}_class_indices.json")

# Check if model exists
if not os.path.exists(MODEL_PATH):
    print(json.dumps({
        "error": f"Model for {crop} not found. Please train the model first.",
        "modelPath": MODEL_PATH
    }))
    sys.exit(1)

if not os.path.exists(CLASS_INDICES_PATH):
    print(json.dumps({
        "error": f"Class indices for {crop} not found.",
        "classIndicesPath": CLASS_INDICES_PATH
    }))
    sys.exit(1)

# Load model
try:
    model = tf.keras.models.load_model(MODEL_PATH)
except Exception as e:
    print(json.dumps({"error": f"Failed to load model: {str(e)}"}))
    sys.exit(1)

# Load class indices
with open(CLASS_INDICES_PATH, "r") as f:
    class_indices = json.load(f)

# Invert dictionary to get index -> class mapping
CLASS_NAMES = {v: k for k, v in class_indices.items()}

# Predict function
def predict_image(img_path):
    try:
        img = image.load_img(img_path, target_size=(224, 224))
        x = image.img_to_array(img)
        x = np.expand_dims(x, axis=0)
        x = x / 255.0  # Normalize

        preds = model.predict(x, verbose=0)
        predicted_class_index = np.argmax(preds[0])
        predicted_class_name = CLASS_NAMES[predicted_class_index]
        confidence = float(preds[0][predicted_class_index] * 100)

        # Determine severity based on disease and confidence
        is_healthy = predicted_class_name.lower() in ["healthy", "healthy_plant"]
        
        if is_healthy:
            severity = "None"
        elif confidence > 85:
            severity = "High"
        elif confidence > 70:
            severity = "Moderate"
        else:
            severity = "Low"

        return {
            "disease": predicted_class_name,
            "confidence": round(confidence, 2),
            "severity": severity,
            "crop": crop.capitalize()
        }
    except Exception as e:
        return {"error": f"Prediction failed: {str(e)}"}

# Main execution
if __name__ == "__main__":
    if not args.image:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)
    
    if not os.path.exists(args.image):
        print(json.dumps({"error": f"Image file not found: {args.image}"}))
        sys.exit(1)
    
    result = predict_image(args.image)
    print(json.dumps(result))
    
    if "error" in result:
        sys.exit(1)
