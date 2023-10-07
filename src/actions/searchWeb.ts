import Agent from '@/agents/agent';
import { Action } from '@/interfaces/action';

export default class SearchWebAction implements Action {
  agent: Agent;
  name = 'search_web';
  description = 'Perform a web search using Google Custom Search JSON API';
  arguments = [
    { name: 'query', type: 'string', required: true },
  ];
  
  // Constructor
  constructor(agent: Agent) {
    this.agent = agent;
  }

  async run(args: { query: string }): Promise<any> {
    const apiKey = 'AIzaSyAv0Ro2l4eoxDeZK_qi4lHixbGgxGoKYDQ'; // Replace with your Google API key
    const cx = '702411e5c9e194819'; // Replace with your Custom Search Engine ID
    const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(args.query)}&key=${apiKey}&cx=${cx}&num=2`;
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error in Google Custom Search API: ${response.statusText}`);
    }

    const data = await response.json();
    return JSON.stringify(data);
  }
}
