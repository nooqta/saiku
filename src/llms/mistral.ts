import Agent from "@/agents/agent";
import { LLM } from "@/interfaces/llm";
import MistralClient from "@mistralai/mistralai";
import axios from "axios";
import dotenv from "dotenv";
import { response } from "express";
import prompts from "prompts";

// Load environment variables from .env file
dotenv.config();

interface PredictionRequest {
  model: string;
  messages: any[];
  tools?: any[];
}

interface PredictionResponse {
  text: string | any[]; // Can contain either a string (the chat content) or an array (the tool calls)
  message: any; // The raw message object from the chat response
  model: string; // The model used for prediction
}

export default class MistralModel implements LLM {
  private apiKey: string;
  name: string;
  messages: any[];
  agent: Agent;
  tools: any[];
  baseURL = "https://api.mistral.ai/v1";

  constructor(
    agent: Agent,
    opts: { apiKey: string | undefined; systemMessage?: string }
  ) {
    this.agent = agent;
    this.apiKey = opts.apiKey || process.env.MISTRAL_API_KEY || "";
    this.name = process.env.MISTRAL_MODEL || "mistral-small-latest";
    this.messages = [];
    this.tools = [];
  }

  async predict(request: PredictionRequest): Promise<PredictionResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: request.model,
          messages: request.messages,
          tools: request.tools,

        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const chatResponse = response.data;
      const message = chatResponse.choices[0].message;

      let text =
        message.tool_calls && message.tool_calls.length > 0
          ? message.tool_calls
          : message.content || "";

      return {
        text: text,
        message: message,
        model: request.model || this.name,
      };
    } catch (error) {
      console.error(`An error occurred: ${error}`);
      throw error; // Propagate the error to the caller
    }
  }

  async interact(useDelegate = false): Promise<void> {
    const decision = await this.agent.think();

    const toolCalls = Array.isArray(decision.text) ? decision.text : [];
    const content = typeof decision.text === "string" ? decision.text : null;
    this.agent.messages.push(decision.message);
    if (content) {
      if (useDelegate) {
        return content;
      } else {
        // Remove speech output logic
        // if (["both", "output"].includes(this.agent.options.speech || "none")) {
        //   await this.agent.speak(content);
        // }
        this.agent.displayMessage(content);
      }
    } else {
      for (const toolCall of toolCalls) {
        let actionName = toolCall.function?.name ?? "";
        let args = toolCall.function?.arguments ?? "";
        let result: any = "";

        if (
          this.agent.memory.lastAction === actionName &&
          this.agent.memory.lastActionStatus === "failure"
        ) {
          continue; // Skip the repeated action if it previously failed
        }

        try {
          args = JSON.parse(args);
          if (!this.agent.options.allowCodeExecution) {
            const { answer } = await prompts({
              type: "confirm",
              name: "answer",
              message: `Do you want to execute the code?`,
              initial: true,
            });
            if (!answer) {
              result = "Code execution cancelled for current action only";
            } else {
              result = await this.agent.act(actionName, args);
            }
          } else {
            result = await this.agent.act(actionName, args);
          }
        } catch (error) {
          console.log(`An error occurred: ${error}`);
          result = JSON.stringify(error);
          process.exit(1);
        }
        this.agent.messages.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: actionName,
          content: result,
        });
      }

      return await this.interact(useDelegate);
    }
  }
}
