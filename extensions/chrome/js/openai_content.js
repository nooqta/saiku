const OriginalXMLHttpRequest = window.XMLHttpRequest;

function PatchedXMLHttpRequest() {
  const xhrInstance = new OriginalXMLHttpRequest();

  const originalOpen = xhrInstance.open;
  const originalSend = xhrInstance.send;

  // Override the `open` method to capture method and URL
  xhrInstance.open = function (method, url, ...rest) {
    this._url = url; // Store the URL for later use
    this._method = method; // Store the method for later use
    return originalOpen.apply(this, [method, url, ...rest]);
  };

  // Override the `send` method
  xhrInstance.send = function (...args) {
    console.log("Intercepted XHR request:", this._method, this._url);
    if (
      this._url.includes("https://chat.openai.com/backend-api/conversation") &&
      this._method === "POST"
    ) {
      // You can add additional logic here

      // For example, attaching an event listener to handle the load event:
      this.addEventListener("load", function () {
        const contentType = this.getResponseHeader("content-type");
        if (contentType && contentType.includes("text/event-stream")) {
          // Handle the SSE stream
          handleSSEStream(this.response);
        }
      });
    }

    return originalSend.apply(this, args);
  };

  return xhrInstance;
}

window.XMLHttpRequest = PatchedXMLHttpRequest;


// Handle the streamed response
function handleSSEStream(stream) {
  const reader = stream.getReader();

  reader.read().then(function processText({ done, value }) {
    if (done) {
      console.log("Stream complete.");
      return;
    }

    // Convert the Uint8Array to a string
    const textChunk = new TextDecoder().decode(value);
    console.log("Received Chunk:", textChunk);

    // Process the chunk as needed
    processReceivedData(textChunk);

    // Read and process the next chunk
    return reader.read().then(processText);
  });
}

// Function to set the user's input in the textarea and click the send button
function setAndSend(userInput) {
  const textarea = document.getElementById("prompt-textarea");
  textarea.value = userInput;
  // Dispatch an input event to simulate user typing
  const event = new Event("input", {
    bubbles: true,
    cancelable: true,
  });
  textarea.dispatchEvent(event);

  // Simulate a click on the send button
  document.querySelector('[data-testid="send-button"]').click();
}

function processReceivedData(data) {
  // Process the received SSE data
  console.log("Processed data:", data);
  chrome.runtime.sendMessage({
    action: "receivedResponse",
    responseText: data,
  });
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "setAndSend") {
    setAndSend(request.userInput);
    sendResponse({ status: "Message set and button clicked" });
  }
});

console.log("OpenAI content script loaded");
