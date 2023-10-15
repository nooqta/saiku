import Agent from "@/agents/agent";

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
    // @todo: review this
    text: string|any;
    model: string;
    otherMetadata?: any;
  }
  
  // Define an abstract class representing a large language model service
  export interface LLM {
    name: string;
   interact(): unknown;
   predict(request: PredictionRequest): Promise<PredictionResponse>;
  }