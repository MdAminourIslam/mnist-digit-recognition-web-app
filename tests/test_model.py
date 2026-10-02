# Test the saved CNN model by loading one MNIST test image and making a prediction

import sys
from pathlib import Path

import tensorflow as tf


PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


from app.model import predict_digit


(_, _), (x_test, y_test) = tf.keras.datasets.mnist.load_data()


index = 0

actual_digit = int(y_test[index])

predicted_digit, confidence = predict_digit(
    x_test[index]
)


print("Actual digit    :", actual_digit)
print("Predicted digit :", predicted_digit)
print("Confidence      :", f"{confidence:.2f}%")