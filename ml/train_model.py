# importing libraries - These libraries help us create, train, and manage the CNN model
import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
from tensorflow.keras.optimizers import Adam #efficient optimizer
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping
from utils.preprocess import load_data

import os # file handling
import json  # save class labels
import argparse # take crop name as input from command line

# Parse arguments for crop type - This allows us to train different crops using the same code
parser = argparse.ArgumentParser(description='Train crop disease detection model')
parser.add_argument('--crop', type=str, default='Tomato', 
                    help='Crop name (e.g., Tomato, Potato, Rice)')
args = parser.parse_args()

CROP_NAME = args.crop
print(f"=" * 60)
print(f"Training model for: {CROP_NAME}")
print(f"=" * 60)

# Load preprocessed data for the specified crop - Splits them into training and testing
train_generator, test_generator = load_data(crop=CROP_NAME)

# Display dataset info
print(f"\n Dataset loaded successfully!")
print(f"   Training samples: {train_generator.samples}")
print(f"   Test samples: {test_generator.samples}")
print(f"   Classes: {list(train_generator.class_indices.keys())}")
print(f"   Number of classes: {train_generator.num_classes}")

# Save class indices to a JSON file
models_dir = os.path.join(os.getcwd(), "ml", "models")
os.makedirs(models_dir, exist_ok=True)

# saves mapping and Later used during prediction to convert model output into disease name.
class_indices_path = os.path.join(models_dir, f"{CROP_NAME.lower()}_class_indices.json")
with open(class_indices_path, "w") as f:
    json.dump(train_generator.class_indices, f, indent=2)
print(f"\n💾 Class indices saved to: {class_indices_path}")

# Transfer learning: MobileNetV2 - This helps in faster and more accurate training.
print(f"\n🔧 Building model...")
base_model = tf.keras.applications.MobileNetV2(
    input_shape=(224, 224, 3),
    include_top=False,
    weights='imagenet'
)
base_model.trainable = False  # Freeze base model - Prevents retraining existing knowledge

x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dense(128, activation='relu')(x)
output = Dense(train_generator.num_classes, activation='softmax')(x) #softmax gives probability for each disease class

model = Model(inputs=base_model.input, outputs=output)

# Compile model
model.compile(
    optimizer=Adam(learning_rate=0.0001),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

print(f" Model built successfully!")

# Callbacks
checkpoint_path = os.path.join(models_dir, f"{CROP_NAME.lower()}_model.h5")
callbacks = [
    ModelCheckpoint(checkpoint_path, monitor='val_accuracy', save_best_only=True, verbose=1),
    EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True, verbose=1)
]

# Train model
print(f"\n Starting training...")
print(f"=" * 60)
history = model.fit(
    train_generator,
    epochs=15,
    validation_data=test_generator,
    callbacks=callbacks,
    verbose=1
)

print(f"\n" + "=" * 60)
print(f" Training completed!")
print(f" Model saved to: {checkpoint_path}")
print(f"=" * 60)

# Evaluate on test set
print(f"\n Evaluating model...")
test_loss, test_accuracy = model.evaluate(test_generator, verbose=0)
print(f"   Test Loss: {test_loss:.4f}")
print(f"   Test Accuracy: {test_accuracy * 100:.2f}%")

print(f"\n Training completed for {CROP_NAME}!")
print(f"To test: python ml/predict.py --image <image_path> --crop {CROP_NAME.lower()}")

