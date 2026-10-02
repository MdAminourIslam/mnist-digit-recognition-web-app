# Convert the browser canvas image into the 28x28 format expected by the MNIST CNN

import base64

import cv2
import numpy as np


def preprocess_image(image_data):
    image_bytes = base64.b64decode(
        image_data.split(",", 1)[1]
    )

    image_array = np.frombuffer(
        image_bytes,
        dtype=np.uint8
    )

    image = cv2.imdecode(
        image_array,
        cv2.IMREAD_GRAYSCALE
    )

    if image is None:
        raise ValueError("Invalid image data.")

    _, image = cv2.threshold(
        image,
        200,
        255,
        cv2.THRESH_BINARY_INV
    )

    coords = cv2.findNonZero(image)

    if coords is None:
        return None

    x, y, width, height = cv2.boundingRect(coords)

    digit = image[
        y:y + height,
        x:x + width
    ]

    max_dimension = max(width, height)

    scale = 20 / max_dimension

    new_width = max(
        1,
        int(width * scale)
    )

    new_height = max(
        1,
        int(height * scale)
    )

    digit = cv2.resize(
        digit,
        (new_width, new_height),
        interpolation=cv2.INTER_AREA
    )

    canvas = np.zeros(
        (28, 28),
        dtype=np.uint8
    )

    x_offset = (
        28 - new_width
    ) // 2

    y_offset = (
        28 - new_height
    ) // 2

    canvas[
        y_offset:y_offset + new_height,
        x_offset:x_offset + new_width
    ] = digit

    return canvas