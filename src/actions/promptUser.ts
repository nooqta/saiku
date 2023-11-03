import Agent from '@/agents/agent';
import { Action } from '../interfaces/action';
import {prompt} from 'prompts';

export default class PromptUserAction implements Action {
    dependencies = ["prompts"];
    agent: Agent;
    name = 'prompt_user';
    description = 'Prompt the user for input based on a specified message and type. The choices argument is only required for select and multiselect types.';
    arguments = [
        { name: 'message', type: 'string', required: true },
        { name: 'type', type: 'array', required: true, items: { type: 'string', enum: ['text', 'number', 'confirm', 'select', 'multiselect', 'autocomplete'] } },
        { name: 'choices', type: 'array', required: false, items: { type: 'string'} }, // only required for select and multiselect types
    ];
// Constructor
constructor(agent: Agent) {
    this.agent = agent;
  }
    async run(args: { message: string, type: string, choices?: any[] }): Promise<any> {
        // Destructure arguments
        const { message, type, choices } = args;
        // Validate arguments
        if (!message || !type) {
            return 'Message and type are required for prompting';
        }

        let promptObject: any = {
            type: type,
            name: 'answer',
            message: message,
        };

        switch (type) {
            case 'autocomplete':
            case 'select':
            case 'multiselect':
                promptObject.choices = choices;
                promptObject.limit = 5;
                break;
            case 'confirm':
                break;
                
        }
        try {
        // Prompt the user for input based on the message and type
        const response = await prompt(promptObject);
        // Return the user input
        return response.answer?.toString() || 'No input provided.';
        } catch (error) {
            return JSON.stringify(error);
        }
    }
}
