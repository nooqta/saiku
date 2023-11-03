// File: apiRequestAction.ts
import Agent from "@/agents/agent";
import { Action } from "@/interfaces/action";
import axios from 'axios'; // Using axios for making API requests

export default class HTTPRequestAction implements Action {
    dependencies = ["axios"];
  agent: Agent;
  
    name = 'http_request';
    description = 'Make HTTP requests to specific URL including API\'s.';
    arguments = [
      { name: 'intent', type: 'string', required: true, description: 'A description of the current API request.'},
      { name: 'url', type: 'string', required: true, description: 'API URL' },
      { name: 'method', type: 'string', required: true, description: 'HTTP Method' },
      { name: 'headers', type: 'object', required: false, description: 'HTTP Headers' },
      { name: 'data', type: 'object', required: false, description: 'Request Body' },
      { name: 'responseProperties', type: 'array', items: {
        type: 'string'
      }, required: false, description: 'Specific properties to return from the response data' },

    ];
    
// Constructor
constructor(agent: Agent) {
  this.agent = agent;
}
  async run(args: any): Promise<any> {
    console.log(`${args.intent} from ${args.url}`);
    try {
      // Make the API request based on the arguments provided
      const response = await axios({
        url: args.url,
        method: args.method,
        headers: args.headers,
        data: args.data,
      });

       // Extract specified properties from the response data if defined
       if (args.responseProperties && Array.isArray(args.responseProperties)) {
        const selectedData: any = {};
        for (const prop of args.responseProperties) {
          if (response.data[prop] !== undefined) {
            selectedData[prop] = response.data[prop];
          }
        }
        return JSON.stringify(selectedData);
      } else {
        // If no properties specified, return the whole response
        return JSON.stringify(response.data);
      }
    } catch (error: any) {
      // Handle errors and return an error message
      return JSON.stringify(error);
    }
  }
}
