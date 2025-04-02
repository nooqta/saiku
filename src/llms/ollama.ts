// Assuming you have these imports at the beginning of your file
import Agent from "@/agents/agent";
import { LLM } from "@/interfaces/llm";
import axios from "axios";
import prompts from "prompts"; // If you're using the prompts library
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();
// Define a generic interface for a prediction request
export interface PredictionRequest {
  prompt?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  model?: string;
  [key: string]: any;
  meta?: {
    useFunctionCalls?: boolean;
    functions?: any;
  };
}

// Define a generic interface for a prediction response
export interface PredictionResponse {
  text: string | any;
  model: string;
  otherMetadata?: any;
}

// Here is your Agent based implementation of the LLM interface
class Ollama implements LLM {
  agent: Agent; // Assume Agent is properly defined in its module
  private baseURL: string = "http://127.0.0.1:11434";
  model: string;
  name: string;
  constructor(
    agent: Agent,
    opts: {
      baseURL?: string;
      model?: string;
    }
  ) {
    this.agent = agent;
    this.baseURL = opts.baseURL || "http://127.0.0.1:11434";
    this.model = opts.model || "llama2";
    this.name = this.model;
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

      // Remove speech output logic
      // if (["both", "output"].includes(this.agent.options.speech || 'none')) {
      //   await this.agent.speak(content, true);
      // }
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
    try {
        const context = `
You are an assistant powered by llama2. When a user asks a question, analyze the input and decide whether to call a function or provide a direct answer. If a function needs to be called, generate the necessary \`functionCall\` JSON. If the question doesn't match any function, provide a clear and concise answer to the user.

Available Functions:\n
${JSON.stringify(request.functions, null, 2)}\n

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
      // Map local prediction request to Ollama's request format.
      const ollamaRequest = {
        model: this.model, // default to llama2 if no model specified
        prompt: request.prompt,
        system: `${context}\n`,
        options: {
          temperature: request.temperature || 0.3,

          // Add more Ollama specific parameters from request if needed.
        },
        stream: false, // Assuming non-streaming for simplicity. Adjust as necessary.
        ...request.meta?.functions, // If there are additional functions specified in meta, spread them here.
      };

      const response = await axios.post(
        `${this.baseURL}/api/generate`,
        ollamaRequest
      );

      // Assuming the non-streaming approach where the response is a single object.
      const responseData = response.data;
      let prediction = responseData.response;
      
      let jsonData;
      // Use a regex to find the JSON string within the response text
      const jsonMatch = prediction.match(/{\s*"functionCall":\s*{[\s\S]*?}}/);
      
      if (jsonMatch && jsonMatch[0]) {
        try {
          // Attempt to parse the matched JSON string
          jsonData = JSON.parse(jsonMatch[0]);
        } catch (e) {
          // Handle JSON parsing error
          console.error("Could not parse JSON:", e);
        }
      }
      
      // If jsonData contains a function call, there's no need to proceed further
      if (jsonData && jsonData.functionCall) {
        // 'prediction' contains the desired JSON structure
        // You could potentially use jsonData.functionCall here directly
      } else {
        // 'prediction' does not contain the desired JSON structure, so proceed with extracting a code block
        const languageMatch = prediction.match(/```(\w*)/);
        const codeBlockMatch = prediction.match(/```(?:\w*\n)?([\s\S]*?)```/);
      
        if (codeBlockMatch && codeBlockMatch[1]) {
          const language = (languageMatch && languageMatch[1]) || "python";  // Default to python if not specified
          const content = codeBlockMatch[1].trim();
      
          jsonData = {
            functionCall: {
              name: "execute_code",
              arguments: {
                language: language,
                content: content,
              },
            },
          };
      
          prediction = JSON.stringify(jsonData, null, 2);
        } else {
          // 'prediction' does not contain a code block, so proceed with extracting a message
          // You may want to define a fallback behavior here
        }
      }      
      
      // Map Ollama's response to local prediction response format.
      const predictionResponse: PredictionResponse = {
        text: prediction,
        model: responseData.model,
        otherMetadata: {
          createdAt: responseData.created_at,
          context: responseData.context,
          duration: {
            total: responseData.total_duration,
            load: responseData.load_duration,
            sample: responseData.sample_duration,
            promptEval: responseData.prompt_eval_duration,
            eval: responseData.eval_duration,
          },
          sampleCount: responseData.sample_count,
          promptEvalCount: responseData.prompt_eval_count,
          evalCount: responseData.eval_count,
        },
      };

      return predictionResponse;
    } catch (error) {
      // @ts-ignore
      throw new Error(`Failed to predict with Ollama: ${error.message}`);
    }
  }
}

export default Ollama;
