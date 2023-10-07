import Agent from "@/agents/agent";
import { Action } from "@/interfaces/action";
import fs from "fs";

export default class UpdateFileContentAction implements Action {
    agent: Agent;
    name = "updateFileContent";
    description = "Update part of a file's content using a regular expression pattern";
    arguments = [
        { name: "pattern", type: "string", required: true, description: "The regular expression pattern to search for in the file." },
        { name: "replacement", type: "string", required: true, description: "The content to replace the matched pattern with." },
        { name: "filename", type: "string", required: true, description: "The path to the file that needs updating." }
    ];
// Constructor
constructor(agent: Agent) {
    this.agent = agent;
  }
    async run(args: any): Promise<string> {
        const { pattern, replacement, filename } = args;

        if (!fs.existsSync(filename)) {
            return `File ${filename} does not exist.`;
        }

        // Read the file content
        const fileContent = fs.readFileSync(filename, 'utf-8');

        // Use the provided regular expression pattern to replace parts of the file content
        const regex = new RegExp(pattern, 'g');
        const updatedContent = fileContent.replace(regex, replacement);

        // Save the updated content back to the file
        fs.writeFileSync(filename, updatedContent);

        return `File ${filename} has been updated successfully.`;
    }
}
