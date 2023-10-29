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

// Function to observe changes in the chat area for new messages
function observeChatForNewMessage(callback) {
    const chatArea = document.querySelector('div[data-testid^="conversation-turn-"]').parentNode;
    if (!chatArea) return;

    const observer = new MutationObserver(mutationsList => {
        for (let mutation of mutationsList) {
            if (mutation.type === "childList" && mutation.addedNodes.length) {
                const addedNode = Array.from(mutation.addedNodes).pop(); // Get the last added node
                if (addedNode && addedNode.nodeType === Node.ELEMENT_NODE) {
                    const assistantMessage = addedNode.querySelector('[data-message-author-role="assistant"]');
                    console.log("New message from observe:", assistantMessage);
                    if (assistantMessage && assistantMessage.innerText) {
                        callback(assistantMessage.innerText); // Pass the response text to the callback
                    }
                }
            }
        }
    });

    observer.observe(chatArea, { childList: true });
}



// Listen for messages from the background script or popup script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "setAndSend") {
    setAndSend(request.userInput);

    // Observe chat for a new message (response from OpenAI)
    observeChatForNewMessage((responseText) => {
      // Once you get the response, you can send it back to the background script or do other tasks
      chrome.runtime.sendMessage({
        action: "receivedResponse",
        responseText: responseText,
      });
    });

    sendResponse({ status: "Message set and button clicked" });
  }
});
