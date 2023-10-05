import { Action } from "@/interfaces/action";
import fs from "fs";
import { exec } from "child_process";

export default class HandMovementAction implements Action {
    name = "handMovement";
    description = "Use hand movements to interact with various elements on an HTML page using opencv.js";
    arguments = [
        { name: "userScript", type: "string", required: true, description: "The JavaScript logic to be executed based on hand movements." }
    ];

    async run(args: any): Promise<string> {
        const userScript = args.userScript;

        if (!userScript) {
            return "No user script provided.";
        }

        // The HTML content
        const htmlContent = `<!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Hand Movement Drawing with Paper.js</title>
            <link
              href="https://fonts.googleapis.com/icon?family=Material+Icons"
              rel="stylesheet"
            />
            <script src="https://cdnjs.cloudflare.com/ajax/libs/paper.js/0.12.15/paper-full.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs"></script>
            <script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/handpose"></script>
            <style>
              .selected {
                border: 3px solid #333 !important;
              }
              .material-icons {
                font-family: "Material Icons";
                font-weight: normal;
                font-style: normal;
                font-size: 24px;
                display: inline-block;
                line-height: 1;
                text-transform: none;
                letter-spacing: normal;
                word-wrap: normal;
                white-space: nowrap;
                direction: ltr;
              }
        
              #actions {
                position: absolute;
                bottom: 10px;
                right: 10px;
                display: flex;
                flex-direction: column;
                gap: 5px;
                z-index: 100;
              }
        
              .action-btn {
                background-color: #fff;
                border: 1px solid #000;
                padding: 5px 10px;
                border-radius: 5px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
              }
        
              body,
              html {
                margin: 0;
                overflow: hidden;
                width: 100%;
                height: 100%;
              }
        
              canvas {
                position: relative;
        
                margin-top: 10px;
                z-index: 1;
                background-color: white;
                transform: scaleX(-1);
                /* Flip canvas horizontally to mirror the video */
              }
              #content {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
              }
              #videoContainer {
                position: absolute;
                top: 10px;
                right: 50%; /* Centering it horizontally */
                width: 100px;
                height: 100px;
                overflow: hidden;
                border-radius: 50%;
                border: 3px solid white;
                z-index: 10;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              #video {
                transform: scaleX(
                  -1
                ); /* Adjusting for the right offset and flipping horizontally */
                max-height: 100%;
              }
        
              #toolbar {
                position: absolute;
                top: 10px;
                left: 10px;
                display: flex;
                justify-content: space-around;
                background-color: #f5f5f5;
                z-index: 10;
                padding: 5px;
                border-radius: 5px;
              }
        
              .color,
              .shape {
                width: 30px;
                height: 30px;
                border: 1px solid black;
                margin: 5px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
              }
        
              .color {
                border-radius: 15px;
              }
            </style>
          </head>
        
          <body>
            <div id="content">
              <canvas id="myCanvas" resize></canvas>
              <div id="videoContainer">
                <video id="video" playsinline autoplay></video>
              </div>
            </div>
            <div id="toolbar">
              <div class="color" style="background-color: red" data-color="red"></div>
              <div class="color" style="background-color: blue" data-color="blue"></div>
              <div
                class="color"
                style="background-color: green"
                data-color="green"
              ></div>
              <div
                class="color"
                style="background-color: yellow"
                data-color="yellow"
              ></div>
              <div
                class="color selected"
                style="background-color: black"
                data-color="black"
              ></div>
              <div class="shape" data-shape="line">
                <i class="material-icons">remove</i>
              </div>
              <div class="shape" data-shape="rectangle">
                <i class="material-icons">crop_square</i>
              </div>
              <div class="shape" data-shape="circle">
                <i class="material-icons">radio_button_unchecked</i>
              </div>
              <div class="shape" data-shape="triangle">
                <i class="material-icons">change_history</i>
              </div>
            </div>
            <div id="actions">
              <div class="action-btn" id="saveBtn">
                <span class="material-icons">save</span>
              </div>
              <div class="action-btn" id="resetBtn">
                <span class="material-icons">clear</span>
              </div>
              <div class="action-btn" id="surpriseBtn">
                <span class="material-icons">sentiment_very_satisfied</span>
              </div>
            </div>
            <script>
              let currentMode = "line"; // Default mode
              paper.setup("myCanvas");
              let tool = new paper.Tool();
              let path;
              let isDrawing = false;
              let detectionLostTimeout = null;
              let startPoint = null;
              // Define a buffer to store the last N positions
        const positionBuffer = [];
        const bufferSize = 5;  // for example, last 5 positions
              const canvas = document.getElementById("myCanvas");
              document.getElementById("saveBtn").addEventListener("click", function () {
                const link = document.createElement("a");
                link.download = "drawing.png";
                link.href = document.getElementById("myCanvas").toDataURL("image/png");
                link.click();
              });
        
              document
                .getElementById("resetBtn")
                .addEventListener("click", function () {
                  // Clear the canvas
                  const ctx = canvas.getContext("2d");
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                });
        
              document
                .getElementById("surpriseBtn")
                .addEventListener("click", function () {
                  alert("You're awesome! Keep drawing 😄");
                });
              tool.onMouseDown = function (event) {
                if (!isDrawing) {
                  isDrawing = true;
                  path = new paper.Path();
                  path.strokeColor = "black";
                  path.add(event.point);
                }
              };
        
              let currentColor = "black"; // Default color
        
              document.querySelectorAll(".color").forEach((colorDiv) => {
                colorDiv.addEventListener("click", (e) => {
                  currentColor = e.target.getAttribute("data-color");
                });
              });
        
              tool.onMouseDrag = function (event) {
                const indexTip = event.indexTip; // Use the passed indexTip
                if (isDrawing) {
                  if (currentMode === "line") {
                    const step = event.delta.divide(2);
                    step.angle += 90;
        
                    const top = event.middlePoint.add(step);
                    const bottom = event.middlePoint.subtract(step);
        
                    path.strokeColor = currentColor;
                    path.add(top);
                    path.insert(0, bottom);
                    path.smooth();
                  } else if (currentMode === "circle") {
                    if (!startPoint) {
                      startPoint = new paper.Point(indexTip[0], indexTip[1]);
                    } else {
                      const radius = startPoint.getDistance(
                        new paper.Point(indexTip[0], indexTip[1])
                      );
                      if (path) path.remove(); // Clear the previous circle
                      path = new paper.Path.Circle(startPoint, radius);
                      path.strokeColor = currentColor;
                    }
                  } else if (currentMode === "rectangle") {
                    path.remove(); // Clear the previous rectangle
                    path = new paper.Path.Rectangle({
                      from: event.downPoint,
                      to: event.point,
                      strokeColor: currentColor,
                    });
                  } else if (currentMode === "triangle") {
                    if (!startPoint) {
                      startPoint = new paper.Point(indexTip[0], indexTip[1]);
                    } else {
                      if (path) path.remove(); // Clear the previous triangle if exists
                      let top = startPoint;
                      let left = new paper.Point(
                        startPoint.x - (indexTip[0] - startPoint.x),
                        indexTip[1]
                      );
                      let right = new paper.Point(indexTip[0], indexTip[1]);
                      path = new paper.Path();
                      path.add(top, left, right);
                      path.closed = true;
                      path.strokeColor = currentColor;
                    }
                  }
                }
              };
        
              tool.onMouseUp = function () {
                if (isDrawing) {
                  isDrawing = false;
                  startPoint = null; // Reset the starting point for triangle
                  path.simplify();
                }
              };
        
              async function setupCamera() {
                const stream = await navigator.mediaDevices.getUserMedia({
                  video: true,
                });
                video.srcObject = stream;
                return new Promise((resolve) => {
                  video.onloadedmetadata = () => {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    resolve(video);
                  };
                });
              }
        
              async function detect(net) {
                const hand = await net.estimateHands(video);
                if (hand.length > 0) {
                  const keypoints = hand[0].landmarks;
                  const indexTip = keypoints[8];
                  const thumbTip = keypoints[4];
                  // Adjust the coordinates based on the canvas dimensions
                  indexTip[0] = indexTip[0] * (canvas.width / video.videoWidth);
                  indexTip[1] = indexTip[1] * (canvas.height / video.videoHeight);
                  thumbTip[0] = thumbTip[0] * (canvas.width / video.videoWidth);
                  thumbTip[1] = thumbTip[1] * (canvas.height / video.videoHeight);
                  positionBuffer.push(indexTip);
            if (positionBuffer.length > bufferSize) {
                positionBuffer.shift();  // remove the oldest position
            }
        
            // Compute average position
            const averagePosition = positionBuffer.reduce(
                (acc, pos) => [acc[0] + pos[0], acc[1] + pos[1]],
                [0, 0]
            ).map(coord => coord / positionBuffer.length);
                  const distance = Math.hypot(
                    indexTip[0] - thumbTip[0],
                    indexTip[1] - thumbTip[1]
                  );
                  if (distance < 30) {
                    if (detectionLostTimeout) {
                      clearTimeout(detectionLostTimeout);
                      detectionLostTimeout = null;
                    }
                    if (!isDrawing) {
                      tool.emit("mousedown", {
                        point: new paper.Point(averagePosition[0], averagePosition[1]),
                      });
                    }
                    tool.emit("mousedrag", {
                      point: new paper.Point(averagePosition[0], averagePosition[1]),
                      delta: new paper.Point(averagePosition[0], averagePosition[1]),
                      middlePoint: new paper.Point(averagePosition[0], averagePosition[1]),
                      indexTip: averagePosition,
                    });
                  } else if (isDrawing) {
                    tool.emit("mouseup");
                  }
                } else if (isDrawing && !detectionLostTimeout) {
                  detectionLostTimeout = setTimeout(() => {
                    tool.emit("mouseup");
                  }, 1000);
                }
        
                requestAnimationFrame(() => detect(net));
              }
        
              document.querySelectorAll(".color").forEach((colorDiv) => {
                colorDiv.addEventListener("click", (e) => {
                  // Remove selected class from all colors
                  document.querySelectorAll(".color").forEach((div) => {
                    div.classList.remove("selected");
                  });
                  // Set the current color
                  currentColor = e.target.getAttribute("data-color");
                  // Add selected class to the clicked color
                  e.target.classList.add("selected");
                });
              });
        
              document.querySelectorAll(".shape").forEach((shapeDiv) => {
                shapeDiv.addEventListener("click", (e) => {
                  // Clear previously selected shape
                  document.querySelectorAll(".shape.selected").forEach((selected) => {
                    selected.classList.remove("selected");
                  });
        
                  // Set current shape
                  currentMode =
                    e.target.getAttribute("data-shape") ||
                    e.target.parentElement.getAttribute("data-shape");
        
                  // Mark the current shape as selected
                  const targetElement = e.target.classList.contains("shape")
                    ? e.target
                    : e.target.parentElement;
                  targetElement.classList.add("selected");
                });
              });
              (async function () {
                await setupCamera();
                video.play();
                const net = await handpose.load();
                detect(net);
              })();
            </script>
          </body>
        </html>
                
        `;

// Rest of the action code...



        // Save the HTML content to a temporary file
        const tempFilePath = "/tmp/handMovement.html";
        fs.writeFileSync(tempFilePath, htmlContent);

        // Start an HTTP server using Python's http.server to serve the file
    const serverPort = 8080;  // You can choose any available port
    const pythonHttpServerCommand = `python3 -m http.server ${serverPort} --directory /tmp/`;
    exec(pythonHttpServerCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
    });

    // Wait a bit to ensure the server starts, then open the served page in a web browser
    setTimeout(() => {
        const openCommand = process.platform === "win32" ? "start" : "open";
        exec(`${openCommand} http://localhost:${serverPort}/handMovement.html`);
    }, 1000);

        return `Hand movement page opened in the browser.`;
    }
}
