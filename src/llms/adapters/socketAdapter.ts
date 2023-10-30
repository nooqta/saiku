import { Server } from "socket.io";
import express from "express";
import { createServer } from "http";
import { LLM, PredictionRequest, PredictionResponse } from "@/interfaces/llm";
import Agent from "@/agents/agent";
import { requiresm } from "esm-ts";

interface SocketAdapterPredictionRequest extends PredictionRequest {
  messages: any[];
  model: string;
  max_tokens?: number;
  temperature?: number;
  topP?: number;
  functions?: any;
}

interface SocketAdapterPredictionResponse extends PredictionResponse {
  text: string;
  model: string;
  otherMetadata?: any;
}

export class SocketAdapterModel implements LLM {
  model!: Server;
  name: string;
  messages: any[];
  agent: Agent;
  io!: Server;
    socket: any;

  constructor(agent: Agent, opts: { systemMessage?: string }) {
    this.agent = agent;
    this.name = "SocketAdapter";
    this.messages = [
      {
        role: "system",
        content: opts.systemMessage || "You are a helpful assistant",
      },
    ];
    this.setupSocket();
  }

  private setupSocket() {
    const app = express();
    app.use(express.json());
    const httpServer = createServer(app);
    this.io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    this.io.on("connection", (socket) => {
        this.socket = socket;
        this.socket.on("error", (error:any) => {
        console.log("Error:", error);
      });
    });

    httpServer.listen(4000, () => {
    });
  }

  async predict(request: SocketAdapterPredictionRequest): Promise<SocketAdapterPredictionResponse> {
    return new Promise((resolve, reject) => {
      // Emit the user's message to the Chrome extension via socket
      const messageWithIdentifier = {
        ...request,
        useOpenAI: true
    };

    // Emit the user's message with identifier to the Chrome extension via socket
    this.socket.emit("message", messageWithIdentifier);

      // Set up a one-time listener for the 'message_response' event
      this.socket.on("message_response", (data: any) => {
        console.log("Received message from the Chrome extension.", data);
        resolve({
          text: data.text || "",
          model: this.name,
        });
      });
    });
  }

  async interact(): Promise<string|void> {
    // @ts-ignore
    const { oraPromise } = await requiresm('ora');

    const decision = await oraPromise(this.agent.think(false));

    // Use SSE data if decision.text is empty or not present
    if (!decision.text) {
        decision.text = await this.receiveSSEData();
    }

    const content = decision.text;

    if (content) {
        this.agent.messages.push({
            role: "assistant",
            content,
        });

        if (['both', 'output'].includes(this.agent.options.speech)) {
            await this.agent.speak(content);
        }

        this.agent.displayMessage(content);
    }
}
// This method waits for SSE data and then returns it
private receiveSSEData(): Promise<string> {
    return new Promise((resolve) => {
        this.socket.once("sse_data", (data: any) => { // Use 'once' to listen for the event only once
            console.log("Received SSE data from the Chrome extension.", data);
            resolve(data.text || "");
        });
    });
}

}
