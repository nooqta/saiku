import { Action } from "@/interfaces/action";
import fs from "fs";
import { exec } from "child_process";
import Agent from "@/agents/agent";
import path from "path";

export default class Js3DMolAction implements Action {
    agent: Agent;
    name = "3Dmol_js";
    description = "Generates a 3D molecular structure using 3Dmol.js on a web page.";
    arguments = [
    ];
// Constructor
constructor(agent: Agent) {
  this.agent = agent;
}
    async run(args: any): Promise<string> {
        // Read The HTML content from ../islands/3Dmol.html
        const filename = path.resolve(__dirname, '../islands/3Dmol.html')
        console.log(filename)
        const htmlContent = fs.readFileSync(filename, "utf8");
        await this.agent.functions['websocket_server'].run({ htmlContent });

        return `Server started on port 3000. Open http://localhost:3000 in your browser to view the 3D molecule structure.`;
    }
}
