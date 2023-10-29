import { Action } from "@/interfaces/action";
import fs from "fs";
import { exec } from "child_process";
import Agent from "@/agents/agent";
import path from "path";

export default class ChatAction implements Action {
    agent: Agent;
    name = "chat";
    description = "Chat with agent using web page.";
    arguments = [
    ];
// Constructor
constructor(agent: Agent) {
  this.agent = agent;
}
    async run(args: any): Promise<string> {
        const filename = path.resolve(__dirname, '../islands/Chat.html')
        console.log(filename)
        const htmlContent = fs.readFileSync(filename, "utf8");
        await this.agent.functions['websocket_server'].run({ htmlContent });

        return `Server started on port 3000. Open http://localhost:3000 in your browser to view the web page.`;
    }
}
