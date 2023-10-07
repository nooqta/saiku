import Agent from "@/agents/agent";

export interface Action {
    name: string;
    description: string;
    arguments: Argument[];
    agent: Agent;
    run(args: any): Promise<string>;
  }
  
  export interface Argument {
    name: string;
    type: string;
    required: boolean;
  }
  