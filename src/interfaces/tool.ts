export interface ToolOptions {
    action: string;
    [key: string]: any; // Allows for dynamic attributes
  }
export interface ActionArgument {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface ToolAction {
  name: string;
  description: string;
  args: ActionArgument[];
}

export interface ToolDescription {
  tool: string;
  description: string;
  actions: ToolAction[];
}
export interface Tool {
    getName(): string;
    run(input: any): Promise<any>;
  }
  