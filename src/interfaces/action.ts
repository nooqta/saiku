import Agent from "@/agents/agent";

export interface Action {
    name: string;
    description: string;
    parameters: Argument[];
    agent: Agent;
    dependencies?: string[];
    run(args: any): Promise<string>;
  }
  
  export interface Argument {
    name: string;
    type: string;
    description?: string;
    required: boolean;
    items?: any; // If array, the type of the items
    properties?: any; // If object, the properties of the object
  }
  