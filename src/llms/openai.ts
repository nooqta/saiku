import Agent from "@/agents/agent";
import { PredictionRequest, PredictionResponse, LLM } from "@/interfaces/llm";
import { TextProcessingTool } from "../tools/text-processing";
import OpenAI from "openai";
import prompts from "prompts";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

interface OpenAIPredictionRequest extends PredictionRequest {
  model: string;
  messages: any[];
  max_tokens?: number;
  temperature?: number;
  topP?: number;
  tools?: any;
}

interface OpenAIPredictionResponse extends PredictionResponse {
  text: string | OpenAI.Chat.Completions.ChatCompletionMessageToolCall[];
  model: string;
  message: OpenAI.Chat.Completions.ChatCompletionMessage;
  otherMetadata?: any;
}

export default class OpenAIModel implements LLM {
  private apiKey: string;
  model: OpenAI;
  name: string;
  messages: any[];
  agent: Agent;
  constructor(
    agent: Agent,
    opts: { apiKey: string | undefined; systemMessage?: string }
  ) {
    this.agent = agent;
    this.apiKey = opts.apiKey || process.env.OPENAI_API_KEY || "";
    this.model = new OpenAI({ apiKey: this.apiKey });
    this.name = process.env.OPENAI_MODEL || "gpt-3.5-turbo";
    this.messages = [
      {
        role: "system",
        content: agent.systemMessage || "You are a helpful assistant",
      },
    ];
  }
  async predict(
    request: OpenAIPredictionRequest
  ): Promise<OpenAIPredictionResponse> {
    try {
      delete request.prompt;
      const decision = await this.model.chat.completions.create(request);
      const toolCalls = decision.choices[0].message.tool_calls || [];
      const content = decision.choices[0].message.content;
      return {
        text: toolCalls.length > 0 ? toolCalls : content || "",
        message: decision.choices[0].message,
        model: request.model || "gpt-3.5-turbo",
      };
    } catch (error) {
      console.log(`An error occurred: ${error}`);
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
        if (["both", "output"].includes(this.agent.options.speech)) {
          await this.agent.speak(content);
        }
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
          result = JSON.stringify(error);
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
