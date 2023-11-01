// Combined content script

if (!window.hasOpenAIScriptInjected) {
  window.hasOpenAIScriptInjected = true;

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

  // Function to create and inject the script
  async function injectScript() {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL('js/island.js');
    document.documentElement.appendChild(script);
    script.remove();
  }

  // Content script listener for messages from the injected script
  window.addEventListener("message", (event) => {
    if(typeof event.data == 'string') {
      event.data = JSON.parse(event.data);
    }
    if (event.data && event.data.type === "FROM_PAGE_STREAM") {
      console.log("Content script received stream message :", event.data);
      chrome.runtime.sendMessage(event.data, response => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
        } else {
          console.log("Content script received response:", response)
        }
      });
    }
  });

  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === "setAndSend") {
      setAndSend(request.userInput);
      await injectScript();
      sendResponse({ status: "Script injected" });
    }
  });

  console.log("openai content script loaded");
}
