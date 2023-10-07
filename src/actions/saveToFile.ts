import { Action } from '../interfaces/action';
import path from 'path';
import fs from 'fs';
import Agent from '@/agents/agent';

export default class SaveToFileAction implements Action {
    agent: Agent;
    name = 'save_to_file';
    description = 'Save content to a file';
    arguments = [
        { name: 'filename', type: 'string', required: true },
        { name: 'content', type: 'string', required: true },
        
    ];
    
    constructor(agent: Agent) {
        this.agent = agent;
    }

    async run(args: { filename: string, content: string }): Promise<any> {
        // Destructure arguments
        const { filename, content } = args;
        // Validate arguments
        if (!filename || !content) {
            throw new Error('Filename and content are required');
        }

        // Resolve the file path
        const filePath = path.resolve(process.cwd(), filename);

        // Write content to the file
        fs.writeFileSync(filePath, content, 'utf8');

        // display a success message
        console.log(`Content has been successfully saved to ${filename}`);
        return filename;

    }
}

