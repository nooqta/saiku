import { prompt } from "prompts";

async function main(action: any) {
    // @todo: uses openai to create a new action based on the interface

    console.log(`Creating a new action: ${action}`);
    console.log('Create a new action not implemented yet')
    switch (action) {
        case 'create':
            create();
            break;
        case 'list':
            list();
            break;
        case 'activate':
            activate();
            break;
        default:
            create();
            break;
    }
}

async function create() {
    // Prompt the user to describe what the action do
    let promptObject: any = {
        type: 'text',
        name: 'answer',
        message: '>',
    };
  
      const {answer} = await prompt(promptObject, { onCancel: () =>  process.exit(0)} );
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
            // use openai: see here src/actions/openaiCompletion.ts
    // Save the action to the default actions folder

}

async function list() {
    // List all the actions with name, description, dependencies and status
}

async function activate() {
    // Prompt the user to select an action that not activated. Not listed in saiku
        // Retrieve the list of actions
        // Prompt with select
    // Install dependencies

    // Add to saiku.json

// Don't forget to update the agent functionLoad to use the saiku.json
// https://vscode.dev/github/nooqta/saiku/blob/main/src/agents/agent.ts#L169
}




// Execute the main function
export default main;
