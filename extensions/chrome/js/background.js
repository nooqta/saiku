let socket;

function updateIconBasedOnConnection(active) {
  if (active) {
    chrome.browserAction.setIcon({ path: "assets/icons/socket-active.png" });
  } else {
    chrome.browserAction.setIcon({ path: "assets/icons/socket-inactive.png" });
  }
}

function setupSocket() {
  socket = io("http://localhost:4000");

  socket.on("connect", function () {
    console.log("Connected to socket.io server");
    updateIconBasedOnConnection(true);
  });

  socket.on("message", (data) => {
    console.log("Message from server:", data);
    handleServerMessage(data);
  });

  socket.onAny((eventName, ...args) => {
    console.log("Got event:", eventName, args);
  });

  socket.on("disconnect", function () {
    console.log("Disconnected from socket.io server");
    updateIconBasedOnConnection(false);
  });

  socket.on("connect_error", function (error) {
    console.log("Connection error:", error);
    updateIconBasedOnConnection(false);
  });

  socket.on("error", function (error) {
    console.log("Error:", error);
    updateIconBasedOnConnection(false);
  });
}

function handleServerMessage(message) {
  try {
    // Parse the message if it's a string
    if (typeof message === "string") {
      message = JSON.parse(message);
    }

    // If the 'useOpenAI' flag is true in the message
    if (message.useOpenAI) {
      // Search for the first tab with the URL 'chat.openai.com'
      chrome.tabs.query({ url: "*://chat.openai.com/*" }, function (tabs) {
        let targetTab = tabs[0]; // Assuming you want to use the first tab that matches
        if (targetTab && targetTab.id) {
          // After injecting the openai_content.js into the target tab
          chrome.tabs.executeScript(
            targetTab.id,
            {
              file: "js/openai_content.js",
            },
            function (result) {
              if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
                socket.emit("message_response", {
                  error: chrome.runtime.lastError.message,
                });
                return;
              }
              console.log("Executed openai_content.js on:", targetTab.url);

              // Send a message to the tab to set the user's input and click send
              chrome.tabs.sendMessage(
                targetTab.id,
                {
                  action: "setAndSend",
                  userInput: message.prompt, // assuming the userInput is contained in the server message
                },
                async function (response) {
                  if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError);
                    socket.emit("message_response", {
                      error: chrome.runtime.lastError.message,
                    });
                    return;
                  }
                  console.log("Response from content script:", response);
                }
              );
            }
          );
        } else {
          console.log("No tab found with URL chat.openai.com");
        }
      });
      return;
    }

    let namespace = message.namespace;
    let action = message.action;

    if (!namespace || !action) {
      throw new Error("Invalid message format");
    }

    // Handle scraping content of an open tab
    if (namespace === "scrape" && action === "getText") {
      const tabId = message.args?.tabId;
      chrome.tabs.executeScript(
        tabId,
        {
          code: "document.body.innerText",
        },
        function (result) {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            socket.emit("message_response", {
              error: chrome.runtime.lastError.message,
            });
            return;
          }
          const scrapedText = result[0];
          console.log("Sending response:", scrapedText);
          socket.emit("message_response", { data: scrapedText });
        }
      );
      return;
    }

    if (
      chrome[namespace] &&
      chrome[namespace][action] &&
      typeof chrome[namespace][action] === "function"
    ) {
      // Handle specific methods
      if (namespace === "tabs" && (action === "query" || action === "create")) {
        chrome[namespace][action](message.args || {}, function (response) {
          const dataToSend = {
            action: `${namespace}.${action}`,
            data: response,
          };
          console.log("Sending response:", dataToSend);
          socket.emit("message_response", dataToSend);
        });
      } else {
        chrome[namespace][action](
          ...Object.values(message.args || {}),
          function (response) {
            const dataToSend = {
              action: `${namespace}.${action}`,
              data: response,
            };
            console.log("Sending response:", dataToSend);
            socket.emit("message_response", dataToSend);
          }
        );
      }
    } else {
      throw new Error(
        `Unrecognized action or namespace: ${namespace}.${action}`
      );
    }
  } catch (error) {
    console.error("Error in handleServerMessage:", error);
    const dataToSend = {
      action: "message_response",
      data: error.message,
    };
    socket.emit("message_response", dataToSend);
  }
}

if (!socket?.connected && !socket?.connecting) {
  console.log("Socket.io connection not established. Reconnecting...");
  setupSocket();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!socket?.connected && !socket?.connecting) {
    console.log("Socket.io connection not established. Reconnecting...");
    setupSocket();
  }

  if (request.action === "receivedResponse") {
    console.log("Received response from content script:", request.responseText);
    socket.emit("message_response", request.responseText);
  } else if (request.type === "SSE_DATA") {
    console.log("Received SSE Data:", request.data);
    socket.emit("sse_data", request.data); // Emitting the SSE data to the server
  } else {
    socket.emit("message", request);
  }

  return true;
});
