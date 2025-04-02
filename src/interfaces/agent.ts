import { Action } from "../interfaces/action";

export interface AgentOptions {
    actionsPath?: string;            // Path to legacy actions (for backward compatibility)
    systemMessage?: string;          // System prompt for the LLM
    allowCodeExecution?: boolean;    // Whether to allow code execution
    interactive?: boolean | string;  // Whether to run in interactive mode
    speech?: 'input' | 'output' | 'both' | 'none'; // Speech options
    llm: string;                     // LLM to use
    useMcp?: boolean;                // Whether to use MCP (default: true)
    mcpSettingsPath?: string;        // Path to the MCP settings JSON file
    [key: string]: any;              // Other options
  }

export interface IAgent {
  name?: string;
  model: any;
  score: number;
  messages: any[];
  memory: any;
  objectives: any[];
  options: AgentOptions;

  // listen(): Promise<string>; // Remove again
  think(): Promise<any>;
  // speak(text: string, useLocal?: boolean): Promise<void>; // Remove again
  interact(): Promise<string|void>;
  displayMessage(message: string): void;
  sense(): Promise<any>;
  act(actionName: string, args: any): Promise<string>;
  evaluatePerformance(): number;
  remember(key: string, value: any): void;
  recall(key: string): any;
  forget(key: string): void;
  saveMemory(): void;
  getMemory(): any;
  updateMemory(args: any): any;
}
