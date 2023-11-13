import Agent from "@/agents/agent";
import { LLM, PredictionRequest, PredictionResponse } from "@/interfaces/llm";
import { HfInference } from "@huggingface/inference";

import dotenv from "dotenv";
import prompts from "prompts";

// Load environment variables from .env file
dotenv.config();

export class HuggingFace implements LLM {
    agent: Agent;
    private apiKey: string;
    private model: string;
    client: HfInference;
    name: string;

    constructor(agent: Agent, opts: {apiKey?: string, model?: string}) {
        this.agent = agent;
        const { apiKey, model } = opts;
        this.name = model || "";
        this.apiKey = apiKey || process.env.HUGGINGFACE_API_KEY || "";
        this.model = model || "gpt-3";
        this.client = new HfInference(apiKey);
    }

    async interact(): Promise<void> {
        const decision = await this.agent.think();
    
        const functionCall =
          typeof decision.text !== "string" ? decision.text : null;
        const content = typeof decision.text === "string" ? decision.text : null;
    
        if (content) {
          this.agent.messages.push({
            role: "assistant",
            content,
          });
    
          if (["both", "output"].includes(this.agent.options.speech || 'none')) {
            await this.agent.speak(content, true);
          }
          this.agent.displayMessage(content);
        } else {
          let actionName = functionCall?.name ?? "";
          let args = functionCall?.arguments ?? "";
          let result: any = "";
    
          // We avoid executing if the last action is the same as the current action
          if (
            this.agent.memory.lastAction === actionName &&
            this.agent.memory.lastActionStatus === "failure"
          ) {
            this.agent.updateMemory({
              lastAction: null,
              lastActionStatus: null,
            });
            return;
          }
    
          try {
            args =
              functionCall?.arguments && typeof functionCall?.arguments == "string"
                ? JSON.parse(functionCall?.arguments ?? "")
                : functionCall?.arguments ?? "";
    
            if (!this.agent.options.allowCodeExecution) {
              // request to execute code
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
            role: "assistant",
            content: result,
          });
    
          this.agent.displayMessage(result);
        }
      }

      async predict(request: PredictionRequest): Promise<PredictionResponse> {
        if (request.model === undefined) {
            throw new Error("Model name must be specified in PredictionRequest.");
        }
        const context = `
        You are an assistant powered by ${this.name}. When a user asks a question, analyze the input and decide whether to call a function or provide a direct answer. If a function needs to be called, generate the necessary \`functionCall\` JSON. If the question doesn't match any function, provide a clear and concise answer to the user.
        
        Available Functions:\n
        ${JSON.stringify(request.functions, null, 2)}\n
        
        Examples:\n
        User: How do I save a text to a file?
        System: 
        {
          "functionCall": {
            "name": "save_to_file",
            "arguments": {
              "filename": "text_file.txt",
              "content": "This is the text to be saved."
            }
          }
        }
        
        User: What's the capital of France?
        System:
        {
          "message": "The capital of France is Paris."
        }
        `;
        switch(request.model) {
            case "gpt2":
            case "gpt3":
            default:
                const response = await this.client.textGeneration({
                    model: request.model,
                    inputs: request.prompt|| "",
                    parameters: {
                        temperature: request.temperature,
                        // @ts-ignore
                        context,
                        top_k: 2000
                    }
                });
                
                return {
                    text: response.generated_text,
                    model: request.model
                };
                break;
        }
    }
}
