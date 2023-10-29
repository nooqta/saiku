import Agent from "@/agents/agent";
import { PredictionRequest, PredictionResponse, LLM } from "@/interfaces/llm";
import { TextProcessingTool } from "../tools/text-processing";
import OpenAI  from "openai";
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
    functions?: any;
  }

  interface OpenAIPredictionResponse extends PredictionResponse {
    text: string | OpenAI.Chat.Completions.ChatCompletionMessage.FunctionCall;
    model: string;
    otherMetadata?: any;
  }
  
  export default class OpenAIModel implements LLM {
    private apiKey: string;
    model: OpenAI;
    name: string;
    messages: any[];
    agent: Agent;
    constructor(agent: Agent, opts: {apiKey: string | undefined, systemMessage?: string}) {
      this.agent = agent;
        this.apiKey = opts.apiKey || process.env.OPENAI_API_KEY || "";
        this.model = new OpenAI({apiKey: this.apiKey});
        this.name = process.env.OPENAI_MODEL || "gpt-3.5-turbo";
        this.messages = [{
            role: "system",
            content: opts.systemMessage || "You are a helpful assistant"
        }];
        }
    async predict(request: OpenAIPredictionRequest): Promise<OpenAIPredictionResponse> {
        try {
          delete request.prompt;
            const decision = await this.model.chat.completions.create(request);
        const functionCall = decision.choices[0].message.function_call;
        const content = decision.choices[0].message.content;
        return {
          text: functionCall || content || "",
          model: request.model || "gpt-3.5-turbo"
        };
      } catch (error) {
        console.log(`An error occurred: ${error}`);
        throw error;  // Propagate the error to the caller
      }
    }

    async interact(): Promise<void> {
      const decision = await this.agent.think();

      const functionCall = typeof decision.text !== 'string'? decision.text: null;
      const content = typeof decision.text === 'string'? decision.text: null;
  
      if (content) {
        this.agent.messages.push({
          role: "assistant",
          content,
        });
        
        if(['both', 'output'].includes(this.agent.options.speech)) {
          await this.agent.speak(content);
        }
        this.agent.displayMessage(content);
      } else {
        let actionName = functionCall?.name ?? "";
        let args = functionCall?.arguments ?? "";
        let result: any = "";
        // We avoid executing if the last action is the same as the current action
        if (this.agent.memory.lastAction === actionName && this.agent.memory.lastActionStatus === 'failure') {
          this.agent.updateMemory({
            lastAction: null,
            lastActionStatus: null,
          });
          return;
        }
        try {
          args = JSON.parse(functionCall?.arguments ?? "");
          if(!this.agent.options.allowCodeExecution) {
            // request to execute code
            const { answer } = await prompts({
              type: "confirm",
              name: "answer",
              message: `Do you want to execute the code?`,
              initial: true
            });
            if(!answer) {
              result = "Code execution cancelled for current action only";
            } else {
              result = await this.agent.act(actionName, args);
            }
          } else {
            result = await this.agent.act(actionName, args);
          }
        } 
        catch (error) {
          result = JSON.stringify(error);
        }
  
  
      const textProcessingTool = new TextProcessingTool();
      // Initialize the OpenAI object
      const chunks = await textProcessingTool.run({
        action: "split-text",
        text: result,
        maxTokens: 3800,
        model: "gpt-3.5-turbo",
      });
        
        this.agent.messages.push({
          role: "function",
          name: actionName,
          // content: chunks.length > 1? await this.agent.functions['text_summarizer'].run({text: result}): result, 
          content: result, 
        });
  
        return await this.interact();
  
      }
    }
  }
    