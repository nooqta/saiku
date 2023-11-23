import Agent from "@/agents/agent";
import { Action } from "@/interfaces/action";
import { OpenAI } from "openai";
import * as fs from "fs";
import dotenv from 'dotenv';

dotenv.config();
export default class ImageToWebPageAction implements Action {
  dependencies = ["openai"];
  name = "image_to_web_page";
  description = "Generate HTML and CSS from an image of a web page design";
  parameters = [
    {
      name: "imagePath",
      type: "string",
      required: true,
      description: "Path to the uploaded image or URL of a remote image.",
    },
    {
      name: "prompt",
      type: "string",
      required: true,
      description: "Prompt to generate a functional HTML and CSS web page that capture the layout, colors palette and disposition of element in the image.",
    },
  ];
  openai: any;
  agent: Agent;

  constructor(agent: Agent) {
    this.agent = agent;
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async run(args: any): Promise<string> {
    const imagePath = args.imagePath;
    const prompt = args.prompt || "Please generate a functional HTML, js and CSS web page that capture the layout, colors palette and disposition of element in the image. respect the dimensions and disposition of the elements in the image.";
    console.log(prompt);
    try {
      console.log("Analyzing image using OpenAI Vision...");
      const output = await this.analyzeImageWithOpenAI(imagePath, prompt);

      console.log("Generating HTML using OpenAI...");
      fs.writeFileSync("output.html", output);
      return output;
    } catch (error) {
      console.error("Error occurred:", error);
      return `Error occurred: ${JSON.stringify(error)}`;
    }
  }

  async analyzeImageWithOpenAI(imagePath: string, text: string) {
    let image_url = imagePath;

    // Check if the imagePath is a URL or a local file
    if (!imagePath.startsWith('http://') && !imagePath.startsWith('https://')) {
      // It's a local file
      const mimeType = this.getMimeType(imagePath.split(".").pop() || "");
      const base64Image = fs.readFileSync(imagePath, "base64");
      image_url = `data:image/${mimeType};base64,${base64Image}`;
    }

    const response = await this.openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text 
            },
            {
              type: "image_url",
              image_url,
            },
          ],
        },
      ],
      max_tokens: 1024,
    });

    return response.choices[0].message.content;
  }

  getMimeType(extension: string) {
    const mimeTypes: { [key: string]: string } = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      bmp: "image/bmp",
      tiff: "image/tiff",
      tif: "image/tiff",
      webp: "image/webp",
    };

    return mimeTypes[extension] || "image/jpeg"; // Default to 'image/jpeg' if the format is unrecognized
  }
}
