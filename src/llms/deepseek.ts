import Agent from "@/agents/agent";
import { PredictionRequest, PredictionResponse, LLM } from "@/interfaces/llm";
import OpenAI from "openai";
import prompts from "prompts";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

interface DeepseekPredictionRequest extends PredictionRequest {
  model: string;
  messages: any[];
  max_tokens?: number;
  temperature?: number;
  topP?: number;
  tools?: any;
}

interface DeepseekPredictionResponse extends PredictionResponse {
  text: string | OpenAI.Chat.Completions.ChatCompletionMessageToolCall[];
  model: string;
  message: OpenAI.Chat.Completions.ChatCompletionMessage;
  otherMetadata?: any;
}

export default class DeepseekModel implements LLM {
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
    this.apiKey = opts.apiKey || process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || "";
    this.model = new OpenAI({ 
      apiKey: this.apiKey,
      baseURL: "https://api.deepseek.com"
    });
    this.name = process.env.DEEPSEEK_MODEL || "deepseek-chat";
    this.messages = [
      {
        role: "user",
        content: agent.systemMessage || "You are a helpful assistant",
      },
    ];
  }
  
  async predict(
    request: DeepseekPredictionRequest
  ): Promise<DeepseekPredictionResponse> {
    try {
      delete request.prompt;
      const decision = await this.model.chat.completions.create(request);
      const toolCalls = decision.choices[0].message.tool_calls || [];
      const content = decision.choices[0].message.content;
      return {
        text: toolCalls.length > 0 ? toolCalls : content || "",
        message: decision.choices[0].message,
        model: request.model || "deepseek-chat",
      };
    } catch (error) {
      console.log(`An error occurred: ${error}`);
      throw error; // Propagate the error to the caller
    }
  }

  async interact(useDelegate = false): Promise<void | string> { // Adjusted return type
    // Pass true to agent.think to enable function/tool calling
    const decision = await this.agent.think(true);

    // The 'decision' object here is the DeepseekPredictionResponse
    // It contains the raw 'message' from the API
    const message = decision.message;
    const toolCalls = message?.tool_calls || [];
    const content = message?.content; // Text content, if any

    // Add the assistant's message (which might include tool calls) to history
    if (message) {
        this.agent.messages.push(message);
    }

    // If there are tool calls, process them
    if (toolCalls.length > 0) {
      for (const toolCall of toolCalls) {
        const actionName = toolCall.function?.name ?? "";
        const argsString = toolCall.function?.arguments ?? "{}"; // Default to empty object string
        let args: any = {};
        let result: any = "";

        // Skip repeated failed actions (optional logic, kept for consistency)
        if (
          this.agent.memory.lastAction === actionName &&
          this.agent.memory.lastActionStatus === "failure"
        ) {
          console.log(`Skipping repeated failed action: ${actionName}`);
          // Need to add a tool response message even if skipped, per API spec
           this.agent.messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: actionName,
              content: "Skipped due to previous failure.",
           });
          continue;
        }

        try {
          args = JSON.parse(argsString);

          // Confirmation logic (kept for consistency)
          // TODO: Refactor confirmation logic if needed, maybe move to agent.act
          let shouldExecute = this.agent.options.allowCodeExecution;
          if (!shouldExecute && actionName === 'run_code') { // Example: only confirm for run_code
             const { answer } = await prompts({
                type: "confirm",
                name: "answer",
                message: `Execute code for tool ${actionName}?`,
                initial: true,
             });
             shouldExecute = answer;
             if (!shouldExecute) {
                result = "Execution cancelled by user.";
             }
          } else {
             // Assume other tools are safe or confirmation is handled elsewhere
             shouldExecute = true;
          }


          if (shouldExecute) {
             // Call agent.act to execute the tool (MCP or legacy)
             result = await this.agent.act(actionName, args);
          }

        } catch (error: any) {
           console.error(`Error processing/executing tool ${actionName}:`, error);
           // Ensure result is a string for the API message
           result = error instanceof Error ? `Error: ${error.message}` : JSON.stringify(error);
           // Optionally exit on critical errors, or just report back
           // process.exit(1);
        }

        // Add the tool result message to history
        this.agent.messages.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: actionName,
          content: result, // Result must be a string
        });
      }

      // After processing ALL tool calls for this turn,
      // call think/interact again to get the LLM's response based on the tool results.
      // This is crucial for the LLM to react to tool errors or results.
      return await this.interact(useDelegate);

    } else if (content) {
      // If there was text content and no tool calls, display/speak it
      if (useDelegate) {
        return content; // Return content if delegating
      } else {
        // Remove speech output logic
        // if (["both", "output"].includes(this.agent.options.speech || 'none')) {
        //   await this.agent.speak(content);
        // }
        this.agent.displayMessage(content);
        // Interaction ends here for a text response
      }
    } else {
        // No content and no tool calls - potentially an error or empty response
        this.agent.displayMessage("_Received an empty response from the assistant._");
        // Decide how to handle this - maybe retry or ask user?
    }
  }
}
