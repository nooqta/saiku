// Importing necessary modules
import { Action } from "@/interfaces/action";
import pdf from 'pdf-parse';

// PDFParseAction Class
export default class PDFParseAction implements Action {
  name = 'parsePDF';
  description = 'Parses a PDF file from a URL or local file path and returns its content.';
  arguments = [
    { name: 'url', type: 'string', required: true, description: 'URL or local file path of the PDF' },
  ];

  // Handle specific operations
  async run(args: any): Promise<any> {
    try {
      // Load PDF file
      const dataBuffer = await this.loadPDF(args.url);
      
      // Parse the PDF content
      const data = await pdf(dataBuffer);
      
      // Return the parsed text content
      return data.text;
    } catch (error) {
      return `Error in PDF Parse Action: ${JSON.stringify(error)}`;
    }
  }

  // Load PDF file from URL or local path
  async loadPDF(url: string): Promise<Buffer> {
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
}
