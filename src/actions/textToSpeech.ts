import fs from 'fs';
import { Action } from '@/interfaces/action';
import dotenv from 'dotenv'; 
import Agent from '@/agents/agent';
import os from 'os';
import OpenAI from 'openai';

dotenv.config();

class TextToSpeechAction implements Action {
  agent: Agent;
  name = 'text_to_speech';
  description = 'Converts text to speech and returns the path to the generated audio file.';
  parameters = [
    {
      name: 'text',
      type: 'string',
      description: 'The text to be converted to speech.',
      required: true
    },
    {
      name: 'play',
      type: 'boolean',
      description: 'Play the audio file after it is generated.',
      required: true,
      default: true
    }
  ];

  constructor(agent: Agent) {
    this.agent = agent;
  }

  async run(args: { text: string, play: boolean }): Promise<string> {
    const { text, play } = args;

    if (os.platform() === 'darwin') {
      // For macOS, use 'say' command via agent.act and execute_command tool
      // Ensure text is properly escaped for the shell command
      const escapedText = text.replace(/(["'$`\\])/g,'\\$1'); // Basic escaping
      await this.agent.act('execute_command', { command: `say "${escapedText}"` });
      return `Text spoken on macOS using system command: ${text}`;
    } else {
      try {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        }); // OpenAI API key from environment variable
        const speechResponse = await openai.audio.speech.create({
          model: "tts-1",
          voice: "alloy",
          input: text,
        });

        const arrayBuffer = await speechResponse.arrayBuffer(); // Get the ArrayBuffer
        const uint8Array = new Uint8Array(arrayBuffer); // Create Uint8Array from ArrayBuffer
        const audioFilePath = 'speak.mp3'; // Path for the audio file
        fs.writeFileSync(audioFilePath, uint8Array); // Write the Uint8Array

        // Play the audio file if required
        if (play) {
          const util = require('util');
          const exec = util.promisify(require('child_process').exec);

          if (os.platform() === 'linux') {
            await exec(`play ${audioFilePath}`);
          } else if (os.platform() === 'win32') {
            await exec(`start ${audioFilePath}`);
          }
        }

        return `Text spoken using OpenAI and saved to: ${audioFilePath}`;
      } catch (error: any) {
        return JSON.stringify(`Error in Text to Speech: ${error.message}`);
      }
    }
  }
}

export default TextToSpeechAction;
