# Train a CNN model on MNIST and save the trained model

import os

import tensorflow as tf
from tensorflow.keras import layers, models


MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "models",
    "mnist_cnn.keras"
)


print("Loading MNIST dataset...")

(x_train, y_train), (x_test, y_test) = (
    tf.keras.datasets.mnist.load_data()
)


print("Preparing dataset...")

x_train = x_train.astype("float32") / 255.0
x_test = x_test.astype("float32") / 255.0

x_train = x_train[..., None]
x_test = x_test[..., None]


print("Building CNN model...")

model = models.Sequential([
    layers.Input(shape=(28, 28, 1)),

    layers.Conv2D(
        32,
        (3, 3),
        activation="relu"
    ),

    layers.MaxPooling2D(
        (2, 2)
    ),

    layers.Conv2D(
        64,
        (3, 3),
        activation="relu"
    ),

    layers.MaxPooling2D(
        (2, 2)
    ),

    layers.Flatten(),

    layers.Dense(
        64,
        activation="relu"
    ),

    layers.Dense(
        10,
        activation="softmax"
    )
])


print("Compiling model...")

model.compile(
    optimizer="adam",
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"]
)


print("Starting training...")

model.fit(
    x_train,
    y_train,
    epochs=5,
    batch_size=64,
    validation_split=0.1
)


print("Evaluating model...")

test_loss, test_accuracy = model.evaluate(
    x_test,
    y_test,
    verbose=1
)


print(
    f"Test Accuracy: {test_accuracy * 100:.2f}%"
)


print("Saving model...")

model.save(MODEL_PATH)


print(f"Model saved to: {MODEL_PATH}")