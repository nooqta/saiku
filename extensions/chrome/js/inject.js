// Content script
if(!window.hasIslandScriptInjected) {
  window.hasIslandScriptInjected = true;
// Function to create and inject the script
async function injectScript() {
  const script = document.createElement("script");
script.src = chrome.runtime.getURL('js/island.js');
document.documentElement.appendChild(script);
  script.remove();
}
let data = {
  type: "FROM_PAGE",
  text: "Hello from the webpage!",
};
// Run the injectScript function when the DOM is fully loaded
async function inject() {
if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  await injectScript();
} else {
  window.addEventListener("DOMContentLoaded", injectScript);
}
}

// Content script listener for messages from the injected script
window.addEventListener("message", (event) => {
  // @todo: this is a temporary tweak
  if(typeof event.data == 'string') {
    event.data = JSON.parse(event.data);
  }
  // Validate message origin and structure
  if (event.data) {
    // Check for the specific message types that indicate stream data or completion
    if (event.data.type === "FROM_PAGE_STREAM") {
      console.log("Content script received stream message :", event.data);

      // Send the stream data or completion message to the background script
      data = event.data;
      chrome.runtime.sendMessage(event.data, response => {
        if (chrome.runtime.lastError) {
           console.error(chrome.runtime.lastError.message);
        } else {
            console.log("Content script received response:", response)
        }
      });
    }
  }
});

  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === "injectScript") {
      callback = sendResponse;
      await inject()
      return false;
    }
    
  });
}
