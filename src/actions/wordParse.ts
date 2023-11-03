// Importing necessary modules
import Agent from "@/agents/agent";
import { Action } from "@/interfaces/action";
import mammoth from 'mammoth';
import textract from 'textract';

// WordParseAction Class
export default class WordParseAction implements Action {
    dependencies = ["mammoth","textract"];
  agent: Agent;
  name = 'word_parse';
  description = 'Parses a MS Word document from a URL or local file path and returns its content.';
  arguments = [
    { name: 'url', type: 'string', required: true, description: 'URL or local file path of the Word document' },
  ];

  // Constructor
  constructor(agent: Agent) {
    this.agent = agent;
  }

  // Handle specific operations
  async run(args: any): Promise<any> {
    try {
      // Load Word file
      const dataBuffer = await this.loadWord(args.url);
      // Parse the Word content
      const data = await this.parseWord(dataBuffer, args.url);
      // Return the parsed text content
      return data;
    } catch (error) {
      return `Error in Word Parse Action: ${JSON.stringify(error)}`;
    }
  }

  // Load Word file from URL or local path
  async loadWord(url: string): Promise<Buffer> {
    // If the URL starts with 'http' or 'https', consider it as an online URL
    if (url.startsWith('http')) {
      const response = await fetch(url);
      const data = await response.arrayBuffer();
      return Buffer.from(data);
    } else {
      // If not, consider it as a local file path
      const fs = require('fs').promises;
      const data = await fs.readFile(url);
      return data;
    }
  }

  // Parse Word file content
  async parseWord(dataBuffer: Buffer, url: string): Promise<string> {
    // If the URL ends with '.docx', use mammoth to extract text
    if (url.endsWith('.docx')) {
      return mammoth.extractRawText({ buffer: dataBuffer })
        .then(result => result.value);
    } else if (url.endsWith('.doc')) {
      // If the URL ends with '.doc', use textract to extract text
      return new Promise((resolve, reject) => {
        textract.fromBufferWithMime('application/msword', dataBuffer, (error, text) => {
          if (error) reject(error);
          else resolve(text);
        });
      });
    } else {
      return 'Invalid file format. Only .doc and .docx files are supported.';
    }
  }
}
