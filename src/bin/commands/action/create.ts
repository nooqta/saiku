import { prompt } from "prompts";
import path from "path";
import Agent from "../../../agents/agent";
import { requiresm } from "esm-ts";
import { Command } from 'commander';




export default async function create(agent: Agent) {
    // Prompt the user to describe what the action do
    let promptObject: any = {
      type: "text",
      name: "answer",
      message: `Describe what the action should do. Specify the arguments and return value:  `,
    };
  
    const { answer } = await prompt(promptObject, {
      onCancel: () => process.exit(0),
    });
  
    // Prompt the user for the filename
    promptObject = {
      type: "text",
      name: "filename",
      message: "Enter the filename for the generated code:",
    };
  
    const { filename } = await prompt(promptObject, {
      onCancel: () => process.exit(0),
    });
  
    agent.systemMessage = `
    You're about to create a new action class based on the following user description and save it to ${path.join(
      agent.options.actionsPath  as string,
      filename
    )}.\n
    Use available tools to create a new action class. The class should implement the Action interface. The Action interface defines the following properties:\n
    Example  class:
    import { Action } from '../interfaces/action';
      import path from 'path';
      import fs from 'fs';
      import Agent from '@/agents/agent';
  
      export default class FileAction implements Action {
          dependencies = []; // Dependencies here
          agent: Agent;
          name = 'file_action';
          description = 'Save content to a file or read content from a file';
          arguments = [
              { name: 'operation', type: 'string', required: true, enum: ['read', 'write'], description: 'Operation to perform: read or write' },
              { name: 'filename', type: 'string', required: true },
              { name: 'content', type: 'string', required: false, description: 'Content to save. Required for write operation.' }
          ];
          
          constructor(agent: Agent) {
              this.agent = agent;
          }
  
          async run(args: { operation: string, filename: string, content?: string }): Promise<any> {
              // Validate arguments
              if (!args.filename) {
                  throw new Error('Filename is required');
              }
  
              // Resolve the file path
              const filePath = path.resolve(process.cwd(), args.filename);
  
              if (args.operation === 'write') {
                  if (!args.content) {
                      throw new Error('Content is required for write operation');
                  }
  
                  // Write content to the file
                  fs.writeFileSync(filePath, args.content, 'utf8');
  
                  // Display a success message
                  console.log(\`Content has been successfully saved to \${args.filename}\`);
                  return \`Content has been successfully saved to \${args.filename}\`;
  
              } else if (args.operation === 'read') {
                  // Check if file exists
                  if (!fs.existsSync(filePath)) {
                      throw new Error(\`File \${args.filename} does not exist\`);
                  }
  
                  // Read the file content
                  const fileContent = fs.readFileSync(filePath, 'utf8');
  
                  // Display a success message
                  console.log(\`Content has been successfully read from \${args.filename}\`);
                  return \`Here is the content: \${fileContent}\`;
  
              } else {
                  throw new Error(\`Invalid operation: \${args.operation}\`);
              }
          }
  }
    `;  
    agent.messages.push({
      role: "user",
      content: `${answer}`,
    });
    // @ts-ignore
    const { oraPromise } = await requiresm('ora');
  await oraPromise(agent.interact());
  }