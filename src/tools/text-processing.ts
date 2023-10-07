// tools/TextProcessingTool.ts

import { Tool } from "../interfaces/tool";


export class TextProcessingTool implements Tool {
    tiktoken: any;

  public getName(): string {
    return "TextProcessingTool";
  }

  public async run(options: any): Promise<any> {
    const { action, text, maxTokens, model } = options;
    this.tiktoken = require('tiktoken-node')
    let encoding = this.tiktoken.encodingForModel(model || "gpt-3.5-turbo-16k");
    switch(action) {
      case 'count-tokens':
        return Promise.resolve(this.countTokens(text, encoding));
      case 'split-text':
        return Promise.resolve(this.splitTextIntoChunks(text, maxTokens, encoding));
      default:
        throw new Error('Invalid action');
    }
  }

  private countTokens(text: string, encoding: any): number {
    const tokens = encoding.encode(text);
    return tokens.length;
  }

  private async splitTextIntoChunks(text: string, maxTokens: number, encoding: any): Promise<string[]> {
    const chunks: string[] = [];
    
    // Determine if the text is JSON
    let isJSON = false;
    try {
      JSON.parse(text);
      isJSON = true;
    } catch (error) {
      isJSON = false;
    }

    if (isJSON) {
      // Handle JSON text
      const jsonObject = JSON.parse(text);
      const jsonString = JSON.stringify(jsonObject, null, 2);  // Pretty print to make it more readable
      const lines = jsonString.split('\n');
      let chunk = "";

      for (const line of lines) {
        const tempChunk = chunk + '\n' + line;
        if (this.countTokens(tempChunk, encoding) <= maxTokens) {
          chunk = tempChunk;
        } else {
          chunks.push(chunk);
          chunk = line;
        }
      }
      chunks.push(chunk);  // Push the last chunk
    } else {
      // Handle regular text
      const words = text.split(' ');
      let chunk = "";

      for (const word of words) {
        const tempChunk = chunk + ' ' + word;
        if (this.countTokens(tempChunk, encoding) <= maxTokens) {
          chunk = tempChunk;
        } else {
          chunks.push(chunk);
          chunk = word;
        }
      }
      chunks.push(chunk);  // Push the last chunk
    }

    return chunks;
  }
}
