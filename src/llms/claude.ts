import Agent from "@/agents/agent";
import { PredictionRequest, PredictionResponse, LLM } from "@/interfaces/llm";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

interface ClaudePredictionRequest extends PredictionRequest {
  model: string;
  system?: string;
  messages: any[];
  max_tokens?: number;
  temperature?: number;
  tools?: any;
}

interface ClaudePredictionResponse extends PredictionResponse {
  text: any[];
  model: string;
  content: string;
  message: any;
  otherMetadata?: any;
}

export default class ClaudeModel implements LLM {
  private apiKey: string;
  model: Anthropic;
  name: string;
  messages: any[];
  agent: Agent;
  constructor(
    agent: Agent,
    opts: { apiKey: string | undefined; systemMessage?: string }
  ) {
    this.agent = agent;
    this.apiKey = opts.apiKey || process.env.Claude_API_KEY || "";
    this.model = new Anthropic({ apiKey: this.apiKey });
    this.name = process.env.Claude_MODEL || "claude-3-opus-20240229";
    this.messages = [];
  }
  async predict(
    request: ClaudePredictionRequest
  ): Promise<ClaudePredictionResponse> {
    try {
      delete request.prompt;
      delete request.tool_choice;
      const modelName = request.model || "claude-3-opus-20240229";
      request.system =
        `${this.agent.systemMessage || "You are a helpful assistant"} \n${JSON.stringify(await this.agent.sense())}`;
      request.messages = request.messages.filter(
        (message) => message.role !== "system"
      );
      
      request.tools = request.tools.map((tool: any) => ({
        name: tool.function.name,
        description: tool.function.description,
        input_schema: {
          type: tool.function.parameters.type,
          properties: Object.entries(
            tool.function.parameters.properties
          ).reduce((acc, [key, value]) => {
            // @ts-ignore
            acc[key] = { type: value.type };
            return acc;
          }, {}),
        },
      }));
      request.max_tokens = request.max_tokens || 2048;
      const decision = await this.model.beta.tools.messages.create(
        request as any
      );
      const toolUseBlocks =
        decision.content.filter((block) => block.type === "tool_use") || [];
        const textBlocks = decision.content
        .filter((block: any) => block.type === "text")
        // @ts-ignore
        .map((block) => block.text);
      const content = textBlocks.join("\n");
      // Determine if there are any tool use actions to report
      const toolCalls = toolUseBlocks.map((block: any) => ({
        toolName: block.name,
        input: block.input,
      }));
      return {
        text: decision.content, // If there are tool calls, prioritize them; otherwise, use content
        content: content, // Always return the textual content for context
        message: decision, // Include the raw response for further processing if needed
        model: modelName,
      };
    } catch (error) {
      console.log(`An error occurred: ${error}`);
      throw error; // Propagate the error to the caller
    }
  }

  async interact(useDelegate = false): Promise<void> {
    const decision = await this.agent.think();
    this.agent.messages.push({
      role: "assistant",
      content: decision.message.content,
    });
    const content = decision.text;
    // Iterate through each content block in the decision
    let message: any = {
      role: "user",
      content: [],
    };
    
    for (const contentBlock of content) {
      if (contentBlock.type === "text") {
        // Handle textual content
        if (useDelegate) {
          return contentBlock.text;
        } else {
          if (
            ["both", "output"].includes(this.agent.options.speech || "none")
          ) {
            await this.agent.speak(contentBlock.text);
          }
          this.agent.displayMessage(contentBlock.text); // Display the textual content
        }
      } else if (contentBlock.type === "tool_use") {
        // Handle tool use actions
        let functionName = contentBlock.name; // Extract the tool's function name
        let args = contentBlock.input; // Extract the input for the tool

        try {
          // Execute the function associated with the tool use
          let result = await this.agent.act(functionName, args);

          // Log success and potentially update messages accordingly
          message.content.push({
            type: "tool_result",
            tool_use_id: contentBlock.id,
            content: [
              { type: "text", text: `${functionName} executed successfully.` },
            ],
          });
        } catch (error) {
          // Handle errors in tool execution
          console.log(`An error occurred in interact: ${error}`);
          message.content.push({
            type: "tool_result",
            tool_use_id: contentBlock.id,
            content: [
              {
                type: "text",
                text: `An error occured. ${functionName} failed execution with error: ${error}.`,
              },
            ],
          });
        }
      }
    }
    if(message.content.length > 0) {
      this.agent.messages.push(message);
      return await this.interact(useDelegate);
    }

  }
}
