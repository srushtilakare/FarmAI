# ml/predict.py
import tensorflow as tf
from tensorflow.keras.preprocessing import image
import numpy as np
import os

MODEL_PATH = os.path.join(os.getcwd(), "ml", "models", "tomato_model.h5")
model = tf.keras.models.load_model(MODEL_PATH)

# Classes mapping (based on folder names in train)
CLASS_NAMES = ['Healthy', 'Early_Blight', 'Late_Blight']

def predict(img_path):
    img = image.load_img(img_path, target_size=(224, 224))
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = img_array / 255.0  # Normalize

    preds = model.predict(img_array)
    class_idx = np.argmax(preds, axis=1)[0]
    confidence = preds[0][class_idx]
    return CLASS_NAMES[class_idx], confidence

# Example usage
if __name__ == "__main__":
    img_path = input("Enter image path: ")
    label, conf = predict(img_path)
    print(f"Predicted: {label} ({conf*100:.2f}%)")
