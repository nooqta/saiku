// Importing necessary modules
import { Action } from "@/interfaces/action";
import fs from 'fs';

// LoopAction Class
export default class LoopAction implements Action {
  name = 'loopAction';
  description = 'Executes multiple actions in a loop with an array of arguments for each.';
  arguments = [
    {
      name: 'actions',
      type: 'array',
      required: true,
      description: 'Array of objects, each containing actionName and argsArray',
      items: {
        type: 'object',
        properties: {
          actionName: { type: 'string', required: true },
          argsArray: { type: 'array', required: false, items: {
            type: 'string',

          }},
        },
      },
    },
  ];

  // Dynamically load actions from the current directory
  async loadActions() {
    const dir = __dirname;
    const files = fs.readdirSync(dir);
    const actions:any = {};
  
    files.forEach((file) => {
        const actionClass = require(file).default;
        const actionInstance: Action = new actionClass();
        actions[actionInstance.name] = actionInstance;
      });
    return actions;
  }

  // Handle specific operations
  async run(args: any): Promise<any> {
    try {
      // Load actions
      const actions = await this.loadActions();
      
      const results = [];

      // Loop through each action and its arguments array in args
      for (const { actionName, argsArray } of args.actions) {
        // Get the action instance from the loaded actions
        const action = actions[actionName];

        // Ensure action is valid and has a run method
        if (!action || typeof action.run !== 'function') {
          throw new Error(`Invalid action name ${actionName}. No corresponding action found.`);
        }

        // Execute the action in a loop with each set of arguments
        for (const actionArgs of argsArray) {
          const result = await action.run(actionArgs);
          results.push({
            action: actionName,
            args: actionArgs,
            result: result,
          });
        }
      }

      // Return the array of results
      return results;
      // Return the array of results
      return JSON.stringify(results);
    } catch (error) {
      return `Error in Loop Action: ${JSON.stringify(error)}`;
    }
  }
}
