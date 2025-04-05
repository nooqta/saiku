import { LLM } from "../interfaces/llm"; // Import LLM interface
import { Message } from "./memory"; // Import Message interface

// src/agents/thinking.ts
// This module will handle interaction with the LLM.

export class ThinkingModule {
  private llm: LLM;

  // TODO: Implement LLM interaction logic
  constructor(llm: LLM) { // Accept LLM instance
    this.llm = llm;
    // Initialization logic if needed
  }

  async think(context: {
    systemMessage: string;
    messages: Message[]; // Use imported Message type
    sensedData: any;
    availableTools: any[];
    llmModel: LLM; // LLM instance is passed here now
  }): Promise<any> {
    console.log("ThinkingModule.think called with context"); // Simplified log

    // Combine system message and sensed data for the prompt context
    // Adjust formatting as needed for the specific LLM
    const systemPromptContent = `${context.systemMessage}\n\n# Environment Context\n${JSON.stringify(context.sensedData, null, 2)}`;

    // Prepare messages for the LLM, potentially including the formatted system prompt
    // depending on the LLM's expected input format.
    // For simplicity, let's assume the LLM's predict method handles prepending the system prompt if needed.
    // We might need to adjust this based on the LLM interface.
    const llmMessages = [
        { role: 'system', content: systemPromptContent }, // Or handle system prompt within predict if supported
        ...context.messages
    ];


    try {
      // Call the LLM's predict method
      const decision = await this.llm.predict({
        // Pass messages, tools, and other necessary parameters
        // The exact structure depends on the LLM interface definition
        messages: llmMessages, // Pass the prepared messages
        tools: context.availableTools,
        tool_choice: context.availableTools.length > 0 ? "auto" : undefined, // Only set tool_choice if tools exist
        // Pass other relevant options if the LLM interface supports them
        // model: this.llm.name, // Assuming model name is accessible or handled internally
      });
      return decision;
    } catch (error: any) {
      console.error(`LLM prediction failed in ThinkingModule: ${error.message}`);
      // Re-throw or return a specific error structure
      throw new Error(`LLM prediction failed: ${error.message}`);
    }
  }
}
