# ml/utils/preprocess.py
import os
import numpy as np
from tensorflow.keras.preprocessing.image import ImageDataGenerator

def load_data(crop='Tomato', img_size=(224, 224), batch_size=32):
    """
    Load and preprocess images for training and testing
    
    Args:
        crop (str): Crop name (e.g., 'Tomato', 'Potato', 'Rice')
        img_size (tuple): Image dimensions (width, height)
        batch_size (int): Batch size for training
    
    Returns:
        train_generator, test_generator
    """
    # Go up 2 levels from utils -> ml
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DATA_DIR = os.path.join(BASE_DIR, "data", crop)

    if not os.path.exists(DATA_DIR):
        raise FileNotFoundError(f"Data directory not found: {DATA_DIR}")

    train_dir = os.path.join(DATA_DIR, "train")
    test_dir = os.path.join(DATA_DIR, "test")

    if not os.path.exists(train_dir):
        raise FileNotFoundError(f"Training directory not found: {train_dir}")
    
    if not os.path.exists(test_dir):
        raise FileNotFoundError(f"Test directory not found: {test_dir}")

    # Data augmentation for training
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=20,
        width_shift_range=0.1,
        height_shift_range=0.1,
        shear_range=0.1,
        zoom_range=0.1,
        horizontal_flip=True,
        fill_mode="nearest"
    )

    # No augmentation for test, just rescale
    test_datagen = ImageDataGenerator(rescale=1./255)

    train_generator = train_datagen.flow_from_directory(
        train_dir,
        target_size=img_size,
        batch_size=batch_size,
        class_mode='categorical'
    )

    test_generator = test_datagen.flow_from_directory(
        test_dir,
        target_size=img_size,
        batch_size=batch_size,
        class_mode='categorical',
        shuffle=False
    )

    return train_generator, test_generator
