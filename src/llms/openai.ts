import { PredictionRequest, PredictionResponse, LLM } from "@/interfaces/llm";
import OpenAI  from "openai";

interface OpenAIPredictionRequest {
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
    messages: any[];
    constructor(opts: {apiKey: string | undefined, systemMessage?: string}) {
        this.apiKey = opts.apiKey || process.env.OPENAI_API_KEY || "";
        this.model = new OpenAI({apiKey: this.apiKey});
        this.messages = [{
            role: "system",
            content: opts.systemMessage || "You are a helpful assistant"
        }];
        }
    async predict(request: OpenAIPredictionRequest): Promise<OpenAIPredictionResponse> {
        try {
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
  }
    