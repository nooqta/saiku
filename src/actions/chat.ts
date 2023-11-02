import { Action } from "@/interfaces/action";
import fs from "fs";
import { exec } from "child_process";
import Agent from "@/agents/agent";
import path from "path";

export default class ChatAction implements Action {
    static dependencies = [];
    agent: Agent;
    name = "chat";
    description = "Chat with agent on a browser.";
    arguments = [
    ];
// Constructor
constructor(agent: Agent) {
  this.agent = agent;
}
    async run(args: any): Promise<string> {
        const filename = path.resolve(__dirname, '../islands/Chat.html')
        const htmlContent = fs.readFileSync(filename, "utf8");
        const response = await this.agent.functions['websocket_server'].run({ htmlContent });
        return `Chat Server started: ${response}`;
    }
}
