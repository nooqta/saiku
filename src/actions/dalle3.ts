import { Action } from '../interfaces/action';
import fs from 'fs';
import { promisify } from 'util';
import path from 'path';
import Agent from '@/agents/agent';
import dotenv from "dotenv";
import OpenAI  from "openai";

dotenv.config();
const writeFile = promisify(fs.writeFile);

export default class Dalle3Action implements Action {
    agent: Agent;
    dependencies = [];
    name = 'dalle3';
    description = 'Generates an image based on a description using OpenAI\'s DALL-E 3 model, saves it to disk, and returns the filename.';
    parameters =[{
        name: 'description',
        type: 'string',
        required: true,
        description: 'Generates an image based on a description using OpenAI\'s DALL-E 3 model, saves it to disk, and returns the filename.'
    }];

    constructor(agent: Agent) {
        this.agent = agent;;
    }
    async run(args: {description: string}): Promise<string> {
         
          const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
          });

          const image = await openai.images.generate({
            model: "dall-e-3",
            prompt: args.description,
            n: 1,
            size: "1024x1024",
          });
          
  
          
          const image_url = image.data[0].url
            if (!image_url) {
              return `Image generation failed: ${image.data}`;
            }


        // Convert response to image and save to disk
        // const imageBuffer = Buffer.from(image_url, 'base64');
        // const filename = `dalle-3-image-${Date.now()}.png`;
        // const filepath = path.resolve('./images', filename);
        // await writeFile(filepath, imageBuffer);

        return `Image generated: ${image_url}`
    }
}