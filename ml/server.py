from flask import Flask, request, jsonify
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import numpy as np
import json

app = Flask(__name__)

# Load your pre-trained model
model = load_model("models/tomato_model.h5")
with open("models/class_indices.json", "r") as f:
    class_indices = json.load(f)
class_indices = {v:k for k,v in class_indices.items()}

def predict(img_path):
    img = image.load_img(img_path, target_size=(224,224))
    img_array = image.img_to_array(img)/255.0
    img_array = np.expand_dims(img_array, axis=0)
    preds = model.predict(img_array)
    class_id = np.argmax(preds)
    return class_indices[class_id]

@app.route("/predict", methods=["POST"])
def predict_route():
    data = request.get_json()
    img_path = data.get("imagePath")
    if not img_path:
        return jsonify({"prediction": None})
    pred = predict(img_path)
    return jsonify({"prediction": pred})

if __name__ == "__main__":
    app.run(port=6000)
