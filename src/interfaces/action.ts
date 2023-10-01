export interface Action {
    name: string;
    description: string;
    arguments: Argument[];
    run(args: any): Promise<string>;
  }
  
  export interface Argument {
    name: string;
    type: string;
    required: boolean;
  }
  