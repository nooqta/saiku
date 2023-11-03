import Agent from "@/agents/agent";
import { Action } from "../interfaces/action";

class UpdateMemory implements Action {
    name = "update_memory";
    description = "Updates the agent's memory with the given key-value pairs";
    arguments = [];
    agent: any;
    // Constructor
  constructor(agent: Agent) {
    this.agent = agent;
  }
    async run(args: { [key: string]: any }): Promise<string> {
        Object.keys(args).forEach(key => {
            this.agent.memory[key] = args[key];
        });
        return "Memory updated successfully.";
    }
}

export default UpdateMemory;
