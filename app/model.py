# Load the trained CNN model and predict a digit from a processed 28x28 image

from pathlib import Path

import numpy as np
from tensorflow.keras.models import load_model


MODEL_PATH = (
    Path(__file__).resolve().parent.parent
    / "models"
    / "mnist_cnn.keras"
)


model = load_model(MODEL_PATH)


def predict_digit(image):
    image = image.astype("float32") / 255.0

    image = image.reshape(
        1,
        28,
        28,
        1
    )

    probabilities = model.predict(
        image,
        verbose=0
    )[0]

    digit = int(
        np.argmax(probabilities)
    )

    confidence = float(
        probabilities[digit] * 100
    )

    return digit, confidence