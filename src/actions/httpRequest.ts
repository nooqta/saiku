// File: apiRequestAction.ts
import { Action } from "@/interfaces/action";
import axios from 'axios'; // Using axios for making API requests

export default class HTTPRequestAction implements Action {
  
    name = 'apiRequest';
    description = 'Make HTTP requests to specific URL including API\'s.';
    arguments = [
      { name: 'intent', type: 'string', required: true, description: 'A description of the current API request.'},
      { name: 'url', type: 'string', required: true, description: 'API URL' },
      { name: 'method', type: 'string', required: true, description: 'HTTP Method' },
      { name: 'headers', type: 'object', required: false, description: 'HTTP Headers' },
      { name: 'data', type: 'object', required: false, description: 'Request Body' },
    ];
    

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

      // Return the response from the API request
      return JSON.stringify(response.data);
    } catch (error: any) {
      // Handle errors and return an error message
      return JSON.stringify(error);
    }
  }
}
