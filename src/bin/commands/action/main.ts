import OpenAI from "openai";
import { prompt } from "prompts";
import fs from 'fs';
import path from 'path';
import { join } from "path";
import { Action } from "@/interfaces/action";
import Agent from '../../../agents/agent';
const { spawn } = require('child_process');

async function main(action: any) {
    // @todo: uses openai to create a new action based on the interface
    const agent = new Agent({ actionsPath: "../actions", llm: "OpenAI"});
    console.log(`Creating a new action: ${action}`);
    console.log('Create a new action not implemented yet')
    switch (action) {
        case 'create':
            await create(agent);
            break;
        case 'list':
           await list(agent);
            break;
        case 'activate':
           await activate(agent);
            break;
        default:
            await create(agent);
            break;
    }
}

async function create(agent:Agent) {
    // Prompt the user to describe what the action do
    let promptObject: any = {
        type: 'text',
        name: 'answer',
        message: '>',
    };

    const { answer } = await prompt(promptObject, { onCancel: () => process.exit(0) });

    // Prompt the user for the filename
    promptObject = {
        type: 'text',
        name: 'filename',
        message: 'Enter the filename for the generated code:',
    };

  const { filename } = await prompt(promptObject, { onCancel: () => process.exit(0) });
    // Use openai to create the action
    //  - system message  includes the action interface 
    const systemMessage = `Create a new action

    class that implements the following interface:
    export interface Action {
        name: string;
        description: string;
        arguments: Argument[];
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
      The action should be able to: ${answer}

       `;
            // Initialize the OpenAI object
            const openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });

            // Use the OpenAI API to generate completions
            const completion = await openai.chat.completions.create({
            messages: [
                {
                role: 'system',
                content:systemMessage,
                },
                {
                role: 'user',
                content: answer,
                },
            ],
            model:  process.env.OPENAI_MODEL || "gpt-3.5-turbo",
            });

            // Return the content from the completion
            const content = completion.choices[0].message.content?? '';
            const filePath = path.resolve(process.cwd(),filename);
            fs.writeFileSync(filePath,content, 'utf8');


}

async function list(agent:Agent) {
    const filePath = path.resolve(process.cwd(), 'saiku.json');  
      const functions = agent.getAllFunctions("")
      console.log('agentoptions',agent.options);
      functions.forEach(async (action) => {
        const isActivated = await  checkIfActionIsActivated(action.name, filePath);
        if (isActivated) {            
            console.log(`Name: ${action.name}`);
            console.log(`Description: ${action.description}`);
            console.log(`Dependencies: ${action.dependencies ? action.dependencies.join(', ') : 'None'}`);
            console.log('---');
          }

      });
  } 
  
  async function checkIfActionIsActivated(action:string, saikuFilePath:string):Promise<boolean>{
    try {
      const saikuData = JSON.parse(fs.readFileSync(saikuFilePath, 'utf8'));
  
      if (saikuData.actions && saikuData.actions.includes(action)) {
        return true; // The action is activated
      }
  
      return false; // The action is not activated
    } catch (error) {
      // Handle file read or JSON parse errors here
      console.error(`Error reading saiku.json: ${error}`);
      return false; // Assume the action is not activated on error
    }
  }

  async function activate(agent:Agent) {
    const saikuFilePath = path.resolve(process.cwd(), 'saiku.json');
    const actions = agent.getAllFunctions(""); // Assuming actions are in the same directory
  
    // Get the list of actions that are not activated
    const unactivatedActions = actions.filter((action:Action) => !isActionActivated(action.name, saikuFilePath));
  
    if (unactivatedActions.length === 0) {
      console.log('No actions to activate.');
      return;
    }
  
    // Prompt the user to select an action to activate
    const choices = unactivatedActions.map((action, index) => ({
      title: action.name,
      description: action.description,
      value: index,
    }));
  
    const { selectedActionIndex } = await prompt({
      type: 'select',
      name: 'selectedActionIndex',
      message: 'Select an action to activate:',
      choices,
    });
  
    if (selectedActionIndex !== undefined) {
      const selectedAction = unactivatedActions[selectedActionIndex];
      const dependencies =selectedAction.dependencies;
      // Install dependencies (You need to define a function for this)
      installActionDependencies(dependencies|| [],selectedAction.name);
  
      // Add the action to saiku.json
      addToSaiku(saikuFilePath, selectedAction.name);
  
      console.log(`Action "${selectedAction.name}" has been activated.`);
    } else {
      console.log('No action selected for activation.');
    }
  }

  function addToSaiku(saikuFilePath:string, actionName:string) {
    try {
      const saikuData = JSON.parse(fs.readFileSync(saikuFilePath, 'utf8'));
  
      if (!saikuData.actions) {
        saikuData.actions = [];
      }
  
      saikuData.actions.push(actionName);
  
      fs.writeFileSync(saikuFilePath, JSON.stringify(saikuData, null, 2), 'utf8');
    } catch (error) {
      console.error(`Error reading/writing saiku.json: ${error}`);
    }
  }  

  function isActionActivated(action:string, saikuFilePath:string) {
    try {
      const saikuData = JSON.parse(fs.readFileSync(saikuFilePath, 'utf8'));
  
      return saikuData.actions && saikuData.actions.includes(action);
    } catch (error) {
      console.error(`Error reading saiku.json: ${error}`);
      return false;
    }
  }
 async function installActionDependencies(dependencies: string[], action: string) {
    return new Promise((resolve, reject) => {
      console.log(`Installing dependencies for "${action}"...`);
  
      const npmInstall = spawn('npm', ['install', ...dependencies]);
  
      npmInstall.on('close', (code:any) => {
        if (code === 0) {
          console.log(`Dependencies for "${action}" installed successfully.`);
          resolve(true);
        } else {
          console.error(`Failed to install dependencies for "${action}".`);
          reject(new Error(`npm install failed with exit code ${code}`));
        }
      });
  
      npmInstall.on('error', (err:any) => {
        console.error(`Error while installing dependencies for "${action}": ${err.message}`);
        reject(err);
      });
  
      npmInstall.stdout.on('data', (data:any) => {
        // Log npm output to the console
        console.log(data.toString());
      });
  
      npmInstall.stderr.on('data', (data:any) => {
        // Log npm error output to the console
        console.error(data.toString());
      });
    });
  }
// Execute the main function
export default main;
