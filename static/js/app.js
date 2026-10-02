// Handle drawing, CNN prediction, actual digit evaluation, and prediction history

const canvas = document.getElementById("digitCanvas");
const ctx = canvas.getContext("2d");

const clearButton = document.getElementById("clearButton");
const predictButton = document.getElementById("predictButton");

const actualDigitInput = document.getElementById("actualDigit");

const predictionValue =
    document.getElementById("predictionValue");

const predictionMessage =
    document.getElementById("predictionMessage");

const confidenceText =
    document.getElementById("confidenceText");

const confidenceBar =
    document.getElementById("confidenceBar");

const loadingState =
    document.getElementById("loadingState");

const processedImage =
    document.getElementById("processedImage");

const processedPlaceholder =
    document.getElementById("processedPlaceholder");

const historyBody =
    document.getElementById("historyBody");

const clearHistoryButton =
    document.getElementById("clearHistoryButton");

const totalPredictions =
    document.getElementById("totalPredictions");

const averageConfidence =
    document.getElementById("averageConfidence");

const evaluatedPredictions =
    document.getElementById("evaluatedPredictions");

const correctPredictions =
    document.getElementById("correctPredictions");


let drawing = false;

const HISTORY_KEY = "mnistPredictionHistory";

let predictionHistory =
    JSON.parse(
        localStorage.getItem(HISTORY_KEY)
    ) || [];



/* Canvas */

function resetCanvas() {

    ctx.fillStyle = "#ffffff";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.strokeStyle = "#000000";

    ctx.lineWidth = 18;

    ctx.lineCap = "round";

    ctx.lineJoin = "round";
}


resetCanvas();



function getPosition(event) {

    const rect =
        canvas.getBoundingClientRect();

    return {
        x:
            (event.clientX - rect.left)
            * (canvas.width / rect.width),

        y:
            (event.clientY - rect.top)
            * (canvas.height / rect.height)
    };
}



canvas.addEventListener(
    "pointerdown",
    function (event) {

        drawing = true;

        canvas.setPointerCapture(
            event.pointerId
        );

        const position =
            getPosition(event);

        ctx.beginPath();

        ctx.moveTo(
            position.x,
            position.y
        );

    }
);



canvas.addEventListener(
    "pointermove",
    function (event) {

        if (!drawing) {
            return;
        }

        const position =
            getPosition(event);

        ctx.lineTo(
            position.x,
            position.y
        );

        ctx.stroke();

    }
);



function stopDrawing(event) {

    drawing = false;

    ctx.beginPath();

    if (
        event &&
        canvas.hasPointerCapture(event.pointerId)
    ) {
        canvas.releasePointerCapture(
            event.pointerId
        );
    }
}


canvas.addEventListener(
    "pointerup",
    stopDrawing
);

canvas.addEventListener(
    "pointercancel",
    stopDrawing
);



/* Clear */

clearButton.addEventListener(
    "click",
    function () {

        resetCanvas();

        actualDigitInput.value = "";

        predictionValue.textContent = "—";

        predictionMessage.textContent =
            "Draw a digit and click Predict";

        confidenceText.textContent = "0%";

        confidenceBar.style.width = "0%";

        processedImage.src = "";

        processedImage.classList.add(
            "hidden"
        );

        processedPlaceholder.classList.remove(
            "hidden"
        );

        loadingState.classList.add(
            "hidden"
        );

        predictButton.disabled = false;
    }
);



/* Validate Actual Digit */

function getActualDigit() {

    const value =
        actualDigitInput.value.trim();

    if (value === "") {
        return null;
    }

    const digit =
        Number(value);

    if (
        !Number.isInteger(digit) ||
        digit < 0 ||
        digit > 9
    ) {
        return undefined;
    }

    return digit;
}



/* Prediction */

predictButton.addEventListener(
    "click",
    async function () {

        const actualDigit =
            getActualDigit();

        if (actualDigit === undefined) {

            predictionMessage.textContent =
                "Actual digit must be a number from 0 to 9.";

            actualDigitInput.focus();

            return;
        }


        const imageData =
            canvas.toDataURL("image/png");


        predictButton.disabled = true;

        loadingState.classList.remove(
            "hidden"
        );

        predictionMessage.textContent =
            "Analyzing your digit...";


        try {

            const response =
                await fetch("/predict", {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        image: imageData
                    })

                });


            const result =
                await response.json();


            if (!response.ok || !result.success) {

                throw new Error(
                    result.message ||
                    "Prediction failed."
                );

            }


            const confidence =
                Number(result.confidence);


            predictionValue.textContent =
                result.digit;


            predictionMessage.textContent =
                "CNN prediction completed";


            confidenceText.textContent =
                `${confidence.toFixed(2)}%`;


            confidenceBar.style.width =
                `${Math.min(confidence, 100)}%`;


            if (result.processed) {

                processedImage.src =
                    `data:image/png;base64,${result.processed}`;

                processedImage.classList.remove(
                    "hidden"
                );

                processedPlaceholder.classList.add(
                    "hidden"
                );

            }


            addPredictionToHistory(
                result.digit,
                confidence,
                actualDigit
            );


        } catch (error) {

            console.error(
                "Prediction error:",
                error
            );

            predictionValue.textContent =
                "—";

            predictionMessage.textContent =
                error.message ||
                "Prediction failed.";

            confidenceText.textContent =
                "0%";

            confidenceBar.style.width =
                "0%";

        } finally {

            loadingState.classList.add(
                "hidden"
            );

            predictButton.disabled =
                false;

        }

    }
);



/* History */

function addPredictionToHistory(
    predicted,
    confidence,
    actual
) {

    const prediction = {

        predicted:
            Number(predicted),

        confidence:
            Number(confidence),

        actual:
            actual === null
                ? null
                : Number(actual),

        time:
            new Date().toISOString()

    };


    predictionHistory.unshift(
        prediction
    );


    predictionHistory =
        predictionHistory.slice(0, 10);


    localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(predictionHistory)
    );


    renderHistory();
}



function renderHistory() {

    historyBody.innerHTML = "";


    if (predictionHistory.length === 0) {

        historyBody.innerHTML = `
            <tr class="empty-history">
                <td colspan="6">
                    No predictions yet.
                </td>
            </tr>
        `;

        updateStatistics();

        return;
    }


    predictionHistory.forEach(
        function (item, index) {

            const row =
                document.createElement("tr");


            const actualText =
                item.actual === null
                    ? "—"
                    : item.actual;


            let statusText = "—";

            let statusClass =
                "status-neutral";


            if (item.actual !== null) {

                if (
                    Number(item.actual) ===
                    Number(item.predicted)
                ) {

                    statusText =
                        "Correct";

                    statusClass =
                        "status-correct";

                } else {

                    statusText =
                        "Incorrect";

                    statusClass =
                        "status-incorrect";

                }

            }


            const date =
                new Date(item.time);


            const timeText =
                date.toLocaleTimeString(
                    [],
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );


            row.innerHTML = `

                <td>
                    ${index + 1}
                </td>

                <td class="digit-cell">
                    ${actualText}
                </td>

                <td class="digit-cell">
                    ${item.predicted}
                </td>

                <td>
                    ${Number(item.confidence).toFixed(2)}%
                </td>

                <td>
                    <span class="status-badge ${statusClass}">
                        ${statusText}
                    </span>
                </td>

                <td>
                    ${timeText}
                </td>

            `;


            historyBody.appendChild(row);

        }
    );


    updateStatistics();
}



function updateStatistics() {

    const total =
        predictionHistory.length;


    totalPredictions.textContent =
        total;


    if (total === 0) {

        averageConfidence.textContent =
            "0%";

        evaluatedPredictions.textContent =
            "0";

        correctPredictions.textContent =
            "0";

        return;
    }


    const confidenceSum =
        predictionHistory.reduce(
            function (sum, item) {

                return sum +
                    Number(item.confidence);

            },
            0
        );


    const average =
        confidenceSum / total;


    averageConfidence.textContent =
        `${average.toFixed(2)}%`;


    const evaluated =
        predictionHistory.filter(
            function (item) {

                return item.actual !== null;

            }
        );


    const correct =
        evaluated.filter(
            function (item) {

                return (
                    Number(item.actual) ===
                    Number(item.predicted)
                );

            }
        );


    evaluatedPredictions.textContent =
        evaluated.length;


    correctPredictions.textContent =
        correct.length;
}



/* Clear History */

clearHistoryButton.addEventListener(
    "click",
    function () {

        if (
            predictionHistory.length === 0
        ) {
            return;
        }


        const confirmed =
            confirm(
                "Are you sure you want to clear prediction history?"
            );


        if (!confirmed) {
            return;
        }


        predictionHistory = [];


        localStorage.removeItem(
            HISTORY_KEY
        );


        renderHistory();
    }
);



/* Load existing history */

renderHistory();