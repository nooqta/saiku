import Agent from "@/agents/agent";

export interface Action {
    name: string;
    description: string;
    arguments: Argument[];
    agent: Agent;
    dependencies?: string[];
    run(args: any): Promise<string>;
  }
  
  export interface Argument {
    name: string;
    type: string;
    required: boolean;
  }
  