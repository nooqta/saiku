import { Action } from "@/interfaces/action";
import Agent from "../agents/agent";
import { prompt } from "prompts";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { createServer } from "http";

export default class NodeAction implements Action {
    dependencies = ["prompts","express","cors","socket.io"];
  agent: Agent;
  name = "browser_interact";
  description = "Interacts with the browser through an internal agent.";
  arguments = [
    {
      name: "input",
      type: "string",
      required: true,
      description: "The user request",
    },
  ];
  worker!: Agent;
  app!: express.Express;
  io!: Server;
  messageReceived: boolean = false;
  socket: any;

  constructor(agent: Agent) {
    this.agent = agent;
  }

  async setupSocket() {
    return new Promise((resolve, reject) => {
      this.app = express();

      // Use the cors middleware
      this.app.use(cors());

      const httpServer = createServer(this.app);

      this.io = new Server(httpServer, {
        cors: {
          origin: "*",
          methods: ["GET", "POST"],
          credentials: true,
        },
      });

      this.io.on("connection", (socket) => {
        this.socket = socket;
        // Handle message from client
        // socket.on("message", (data) => {
        //   console.log("Received message from the Chrome extension.", data);
        //   // Process the data and emit a response if needed
        //   // socket.emit('response', responseData);
        // });

        socket.on("error", (error) => {
          console.log("Error:", error);
        });
        
 
        socket.on("connect_error", (error) => {
          console.log("Connect Error:", error);
        });
        socket.on("error", (error) => {
          console.log("Error:", error);
        });
      });

      httpServer
        .listen(4000, () => {
          console.log("Express and Socket.io server started on port 4000");
          resolve(true);
        })
        .on("error", (err) => {
          console.error("Error starting the server:", err);
          reject(err);
        });
    });
  }

  async run(args: { input: string }): Promise<string> {
    this.worker = new Agent({
      ...this.agent.options,
      actionsPath: "../actions",
    });

    await this.setupSocket();
    const currentNode = "Chrome extension";
    this.worker.systemMessage = `
You are a JSON server striclty responding in JSON format. you are interacting with the Chrome browser through a dynamic API invoker using strict JSON.

To communicate with the Chrome API, send messages in the following format:

{
  "namespace": "namespaceName",
  "action": "actionName",
  "args": {}
}

Where:
- **namespace**: Represents the Chrome API namespace you want to access, e.g., "tabs", "windows", etc.
- **action**: Represents the method within that namespace you want to execute, e.g., "query", "create", etc.
- **args**: An optional field containing the arguments for the method. The structure of this field depends on the specific method you're calling.

For example, to list all open tabs:

{
  "namespace": "tabs",
  "action": "query",
  "args": {}
}

To open a new window with a specific URL:

{
  "namespace": "windows",
  "action": "create",
  "args": {"url": "https://www.example.com"}
}
To **scrape** the content of an open tab:

{
  "namespace": "scrape",
  "action": "getText",
  "args": {"tabId": 123}  // Optional tabId. If not provided, current active tab is used.
}\n

Ensure to send the correctly formatted message for desired actions.
`;
    await this.interact(args.input);
    return "Action completed!";
  }

  async interact(userQuery = "") {
    const currentNode = "Chrome extension";
    let message = `_You are now interacting with the node agent. Type "quit" to exit._`;
    this.worker.displayMessage(message);
    this.worker.messages.push({
      role: "system",
      content: this.worker.systemMessage,
    });

    // Function that returns a promise which resolves on receiving a message from the Chrome extension
    const waitForResponse = () => {
      return new Promise((resolve, reject) => {
        // Set up a one-time listener for the 'message_response' event
        this.socket.on("message_response", async (data: any) => {
          console.log("Received message from the Chrome extension.");
          this.worker.messages.push({
            role: "function",
            name: "chrome",
            content: JSON.stringify(data),
          });
          const content = await this.worker.think();
          if (["both", "output"].includes(this.worker.options.speech)) {
            await this.worker.speak(content.text);
          }
          this.worker.displayMessage(content.text);
          this.messageReceived = true;
          resolve(data);
        });

        // Optional: Set a timeout to reject the promise if no response is received within a certain time frame
        setTimeout(() => {
          reject(
            new Error("Timeout waiting for response from the Chrome extension.")
          );
        }, 30000); // Wait for 10 seconds
      });
    };

    do {
      this.messageReceived = false;
      const { answer } = await prompt({
        type: "text",
        name: "answer",
        message: `${currentNode} > `,
        initial: userQuery,
      });
      userQuery = answer;

      if (userQuery.toLowerCase() !== "quit") {
        this.worker.messages.push({
          role: "user",
          content: userQuery,
        });

        const decision = await this.worker.think();
        this.agent.messages.push({
          role: "assistant",
          content: decision.text,
        });

        // Emit a message to the browser extension using socket.io
        this.io.emit("message", decision.text);

        // Wait for a response from the Chrome extension
        try {
          const response = await waitForResponse();
        } catch (error) {
          console.error(error);
        }
      } else {
        this.worker.displayMessage("Bye!");
      }
    } while (userQuery.toLowerCase() !== "quit");
  }
}
