// Combined content script
if (!window.hasOpenAIScriptInjected) {
  window.hasOpenAIScriptInjected = true;

  // Function to set the user's input in the textarea and trigger the Enter key
  function setAndSend(userInput) {
      const textarea = document.getElementById("prompt-textarea");
      if (!textarea) {
          console.error("Textarea element not found");
          return;
      }

      // Set the content of the contenteditable element
      textarea.textContent = userInput;

      // Dispatch an input event to simulate typing
      const inputEvent = new Event("input", { bubbles: true, cancelable: true });
      textarea.dispatchEvent(inputEvent);

      // Simulate Enter key press
      const enterKeyEvent = new KeyboardEvent("keydown", {
          key: "Enter",
          code: "Enter",
          bubbles: true,
          cancelable: true,
      });
      textarea.dispatchEvent(enterKeyEvent);
  }

  // Function to process received SSE data
  function processReceivedData(data) {
      console.log("Processed data:", data);
      chrome.runtime.sendMessage({
          action: "receivedResponse",
          responseText: data,
      });
  }

  // Function to create and inject the script
  async function injectScript() {
      const script = document.createElement("script");
      script.src = chrome.runtime.getURL('js/island.js');
      document.documentElement.appendChild(script);
      script.remove();
  }

  // Content script listener for messages from the injected script
  window.addEventListener("message", (event) => {
      if (typeof event.data === "string") {
          event.data = JSON.parse(event.data);
      }
      if (event.data && event.data.type === "FROM_PAGE_STREAM") {
          console.log("Content script received stream message:", event.data);
          chrome.runtime.sendMessage(event.data, (response) => {
              if (chrome.runtime.lastError) {
                  console.error(chrome.runtime.lastError.message);
              } else {
                  console.log("Content script received response:", response);
              }
          });
      }
  });

  // Listener for messages from the background script
  chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
      if (request.action === "setAndSend") {
          setAndSend(request.userInput); // Update the text and simulate Enter key press
          await injectScript();
          sendResponse({ status: "Script injected" });
      }
  });

  console.log("openai content script loaded");
}
