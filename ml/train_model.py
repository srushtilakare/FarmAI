import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping
from utils.preprocess import load_data
import os
import json

# Load preprocessed data
train_generator, test_generator = load_data()

# Save class indices to a JSON file
class_indices_path = os.path.join(os.getcwd(), "ml", "models", "class_indices.json")
with open(class_indices_path, "w") as f:
    json.dump(train_generator.class_indices, f)
print(f"Class indices saved to {class_indices_path}: {train_generator.class_indices}")

# Transfer learning: MobileNetV2
base_model = tf.keras.applications.MobileNetV2(
    input_shape=(224, 224, 3),
    include_top=False,
    weights='imagenet'
)
base_model.trainable = False  # Freeze base model

x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dense(128, activation='relu')(x)
output = Dense(train_generator.num_classes, activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=output)

# Compile model
model.compile(
    optimizer=Adam(learning_rate=0.0001),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# Callbacks
checkpoint_path = os.path.join(os.getcwd(), "ml", "models", "tomato_model.h5")
callbacks = [
    ModelCheckpoint(checkpoint_path, monitor='val_accuracy', save_best_only=True, verbose=1),
    EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)
]

# Train model
history = model.fit(
    train_generator,
    epochs=15,
    validation_data=test_generator,
    callbacks=callbacks
)

print(f"Model saved to {checkpoint_path}")
