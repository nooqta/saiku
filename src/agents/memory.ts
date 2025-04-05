// src/agents/memory.ts
// This module manages the agent's state, including conversation history and short-term memory.
import fs from "fs";
import path from "path";

// Define a structure for messages if not already defined globally
export interface Message { // Added export
  role: "user" | "assistant" | "system" | "tool"; // Add 'tool' role
  content: string | any; // Content can be string or structured for tool results
  // Add other potential message properties like tool_call_id, tool_use_id if needed
}

// Define a structure for short-term memory items
export interface ShortTermMemory { // Added export
  lastAction: string | null;
  lastActionStatus: "success" | "failure" | null;
  // Add other relevant short-term state if needed
}

export class MemoryModule {
  private messages: Message[] = [];
  private shortTermMemory: ShortTermMemory = {
    lastAction: null,
    lastActionStatus: null,
  };
  private memoryFilePath: string | null = null; // Optional file path for persistence

  constructor(memoryFilePath?: string) {
    if (memoryFilePath) {
      this.memoryFilePath = memoryFilePath;
      this.loadMemoryFromFile(); // Load existing memory if path provided
    }
  }

  // --- Conversation History Management ---

  addMessage(message: Message): void {
    this.messages.push(message);
    this.saveMemoryToFile(); // Persist after adding
  }

  getMessages(): Message[] {
    // Return a copy to prevent external modification
    return [...this.messages];
  }

  clearMessages(): void {
    this.messages = [];
    this.saveMemoryToFile(); // Persist after clearing
  }

  // Optional: Method to get messages suitable for LLM context window
  getMessagesForLLM(maxLength: number = 10): Message[] {
    if (this.messages.length <= maxLength) {
      return [...this.messages];
    }
    // Keep the first (system?) message and the last N messages
    const systemMessage = this.messages.find(m => m.role === 'system');
    const recentMessages = this.messages.slice(-(maxLength - (systemMessage ? 1 : 0)));
    return systemMessage ? [systemMessage, ...recentMessages] : recentMessages;
  }


  // --- Short-Term Memory Management ---

  updateShortTermMemory(updates: Partial<ShortTermMemory>): void {
    this.shortTermMemory = { ...this.shortTermMemory, ...updates };
    this.saveMemoryToFile(); // Persist after updating
  }

  getShortTermMemory(): ShortTermMemory {
    // Return a copy
    return { ...this.shortTermMemory };
  }

  getLastAction(): string | null {
    return this.shortTermMemory.lastAction;
  }

  getLastActionStatus(): "success" | "failure" | null {
    return this.shortTermMemory.lastActionStatus;
  }

  // --- Persistence (Optional) ---

  private saveMemoryToFile(): void {
    if (!this.memoryFilePath) return;
    try {
      const state = {
        messages: this.messages,
        shortTermMemory: this.shortTermMemory,
      };
      // Ensure directory exists
      const dir = path.dirname(this.memoryFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.memoryFilePath, JSON.stringify(state, null, 2));
      console.log(`Memory saved to ${this.memoryFilePath}`);
    } catch (error) {
      console.error(`Error saving memory to ${this.memoryFilePath}:`, error);
    }
  }

  private loadMemoryFromFile(): void {
    if (!this.memoryFilePath || !fs.existsSync(this.memoryFilePath)) return;
    try {
      const data = fs.readFileSync(this.memoryFilePath, "utf-8");
      const state = JSON.parse(data);
      if (state.messages) {
        this.messages = state.messages;
      }
      if (state.shortTermMemory) {
        this.shortTermMemory = state.shortTermMemory;
      }
      console.log(`Memory loaded from ${this.memoryFilePath}`);
    } catch (error) {
      console.error(`Error loading memory from ${this.memoryFilePath}:`, error);
      // Decide if we should clear state or continue with defaults
      this.messages = [];
      this.shortTermMemory = { lastAction: null, lastActionStatus: null };
    }
  }
}
