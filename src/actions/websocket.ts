import { Action } from "../interfaces/action";
import Agent from "@/agents/agent";
import express from "express";
import { Server } from "socket.io";
import { createServer, Server as HttpServer } from "http";
import cors from "cors";
import path from "path";
export default class WebsocketAction implements Action {
  agent: Agent;
  name = "websocket_server";
  description =
    "Starts a websocket server for real-time communication with the agent.";
  arguments = [
    {
      name: "htmlContent",
      type: "string",
      required: true,
      description: "The HTML content to be served on the root endpoint",
    },
  ];

  constructor(agent: Agent) {
    this.agent = agent;
  }

  async run(args: { htmlContent: string }): Promise<any> {
    try {
      const app = express();
      app.use(cors());
      const assetsPath = path.join(__dirname, "../.."); // TODO: make this configurable
      app.use(express.static(assetsPath));
      const server: HttpServer = createServer(app);
      const io: Server = new Server(server, {
        cors: {
          origin: "*", // Allow any origin
          methods: ["GET", "POST"],
          credentials: true,
        },
      });

      app.get("/", (req, res) => {
        res.send(args.htmlContent);
      });

      io.on("connection", (socket: any) => {
        console.log("a user connected");

        socket.on("agent_request", async (data: any) => {
          let responseFromAgent = await this.processAgentRequest(data);
          socket.emit("agent_response", responseFromAgent);
        });

        socket.on("disconnect", () => {
          console.log("user disconnected");
        });
      });

      server.listen(3000, () => {
        console.log("Server started on *:3000");
      });

      return `Server started on *:3000`;
    } catch (err) {
      console.error("socket", err);
      throw new Error("Failed to start the websocket server");
    }
  }

  async processAgentRequest(data: any) {
    data = JSON.parse(data);
    this.agent.messages = data;
    const response = await this.agent.interact(true);
    console.log("response", response);
    return response;
  }
}
