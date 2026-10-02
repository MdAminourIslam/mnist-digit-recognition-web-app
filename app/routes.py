# Handle web routes and return the CNN prediction with the processed 28x28 image

import base64

import cv2

from flask import Blueprint, jsonify, render_template, request

from app.model import predict_digit
from app.preprocessing import preprocess_image


main = Blueprint("main", __name__)


@main.route("/")
def home():
    return render_template("index.html")


@main.route("/predict", methods=["POST"])
def predict():

    data = request.get_json()

    if not data or "image" not in data:
        return jsonify({
            "success": False,
            "message": "No image received."
        }), 400

    try:

        processed_image = preprocess_image(
            data["image"]
        )

        if processed_image is None:
            return jsonify({
                "success": False,
                "message": "No digit detected."
            })

        digit, confidence = predict_digit(
            processed_image
        )

        success, encoded_image = cv2.imencode(
            ".png",
            processed_image
        )

        if not success:
            return jsonify({
                "success": False,
                "message": "Could not process the image."
            }), 500

        processed_base64 = base64.b64encode(
            encoded_image
        ).decode("utf-8")

        return jsonify({
            "success": True,
            "digit": digit,
            "confidence": round(
                confidence,
                2
            ),
            "processed": processed_base64
        })

    except Exception as error:

        print("Prediction error:", error)

        return jsonify({
            "success": False,
            "message": "Prediction failed."
        }), 500