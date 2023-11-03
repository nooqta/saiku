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
    console.log("Initializing SocketAdapter model...");
    this.messages = [
      {
        role: "system",
        content: opts.systemMessage || "You are a helpful assistant",
      },
    ];
  }
  async init() {
    await this.setupSocket();
  }

  async setupSocket() {
    return new Promise((resolve, reject) => {
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
        this.socket.on("error", (error: any) => {
          console.log("Error:", error);
          reject(error);
        });
        this.socket.on("disconnect", () => {});
        resolve(true);
      });

      httpServer.listen(4000, () => {});
    });
  }

  parse(rawStream: string): any[] {
    // Use non-greedy capture to get all JSON objects without trailing newlines
    let matches = rawStream.match(/(\{[\s\S]*?\})(?=\n\n|$)/g);

    // If no matches, return an empty array
    if (!matches) return [];

    // Convert matches to a valid JSON array string
    let result = `[${matches.join(",")}]`;

    try {
      return JSON.parse(result);
    } catch (error) {
      return [];
    }
  }

  async predict(
    request: SocketAdapterPredictionRequest
  ): Promise<SocketAdapterPredictionResponse> {
    return new Promise((resolve, reject) => {
      // Emit the user's message to the Chrome extension via socket
      const messageWithIdentifier = {
        ...request,
        useOpenAI: true,
      };

      // Emit the user's message with identifier to the Chrome extension via socket
      this.socket.emit("message", messageWithIdentifier);
      // Set up a one-time listener for the 'message_response' event
      this.socket.on("message_response", (data: any) => {
        // Check if we have an error
          if (typeof data == 'object' && data.error) {
            return resolve({
              text: data.error,
              model: this.name,
            });
          }

          data = this.parse(data);
        // get last message
        if (!data || !data.length) {
          resolve({
            text: "An error occurred while processing your request. Please try again later.",
            model: this.name,
          });
        }

        // get the success message with status finished_successfully
        const successMessage = data.find(
          (item: any) =>
            item.message && item.message.status === "finished_successfully"
        );
        
        const hasError = successMessage.message.error;
        if (hasError || !successMessage) {
          resolve({
            text: "An error occurred while processing your request. Please try again later.",
            model: this.name,
          });
        }

        // Access the content parts array
        const contentParts = successMessage.message.content.parts;

        // Concatenate all parts to form the final content
        const finalContent = contentParts.join("");
        resolve({
          text: finalContent,
          model: this.name,
        });
      });
    });
  }

  async interact(): Promise<string | void> {
    if (!this.socket) {
      await this.setupSocket();
    }
    // @ts-ignore
    const { oraPromise } = await requiresm("ora");
    const decision = await oraPromise(this.agent.think(false));

    const content = decision.text;

    if (content) {
      this.agent.messages.push({
        role: "assistant",
        content,
      });

      if (["both", "output"].includes(this.agent.options.speech)) {
        await this.agent.speak(content);
      }

      this.agent.displayMessage(content);
    }
  }
}
