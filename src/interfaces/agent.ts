import { Action } from "../interfaces/action";

export interface AgentOptions {
    actionsPath: string;
    systemMessage?: string;
    allowCodeExecution?: boolean;
    [key: string]: any;
  }

export interface IAgent {
  name?: string;
  model: any;
  score: number;
  messages: any[];
  memory: any;
  objectives: any[];
  options: AgentOptions;

  listen(): Promise<string>;
  think(): Promise<any>;
  speak(text: string, useLocal?: boolean): Promise<void>;
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

