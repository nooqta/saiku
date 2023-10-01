import OpenAI from 'openai';
import { Action } from '@/interfaces/action';
import dotenv from 'dotenv'; 
dotenv.config();

export default class OpenAICompletionAction implements Action {
  name = 'openai_completion';
  description = 'Generate completions using the OpenAI API.';
  arguments = [
    { name: 'userQuery', type: 'string', required: true },
  ];

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
      model: 'gpt-3.5-turbo',
    });

    // Return the content from the completion
    return completion.choices[0].message.content?? '';
  }
}
