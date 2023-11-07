import OpenAI from 'openai';
import { Action } from '@/interfaces/action';
import Agent from '@/agents/agent';
import dotenv from 'dotenv'; 
dotenv.config();

export default class OpenAICompletionAction implements Action {
    dependencies = ["openai","dotenv"];
  agent: Agent;
  name = 'openai_completion';
  description = 'Generate completions using the OpenAI API.';
  parameters =[
    { name: 'userQuery', type: 'string', required: true },
  ];
public systemMessage = 'You are a helpful assistant.';
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
          content: this.systemMessage,
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
