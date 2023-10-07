import OpenAI from 'openai';
import { Action } from '@/interfaces/action';
import dotenv from 'dotenv'; 
import Agent from '@/agents/agent';
dotenv.config();

export default class OpenAICompletionAction implements Action {
  agent: Agent;
  name = 'openai_completion';
  description = 'Generate completions using the OpenAI API.';
  arguments = [
    { name: 'userQuery', type: 'string', required: true },
  ];
// Constructor
constructor(agent: Agent) {
  this.agent = agent;
}
  async run(args: { userQuery: string }): Promise<string> {

    // Initialize the OpenAI object
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

    // Use the OpenAI API to generate completions
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.',
        },
        {
          role: 'user',
          content: args.userQuery,
        },
      ],
      model:  process.env.OPENAI_MODEL || "gpt-3.5-turbo",
    });

    // Return the content from the completion
    return completion.choices[0].message.content?? '';
  }
}
