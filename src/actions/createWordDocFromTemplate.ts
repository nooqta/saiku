// Importing necessary modules
import { join, dirname } from "path";
import fs from "fs";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { Action } from "@/interfaces/action";

const fsPromises = fs.promises;

// EngineAction Class
export default class CreateWordDocFromTemplateAction implements Action {

    name = 'createWordDocFromTemplate';
    description = 'Creates  a .doc, .docx document using a Mircosoft Word file and object data for placeholders.';
    arguments = [
      { name: 'templatePath', type: 'string', required: true, description: 'Path to the Word document template' },
      { name: 'data', type: 'object', required: true, description: 'Object data containing values for placeholders in the template' },
      { name: 'outputPath', type: 'string', required: true, description: 'Path to output the created or overwritten Word document' },
      { name: 'overwrite', type: 'boolean', required: false, description: 'Flag for overwriting the document, default is false' }
    ];

  // Overriding the run method to handle specific operations
  async run(args: any): Promise<any> {
    try {
      const template = await this.read(args.templatePath);
      const compiledDoc = this.compile(template, args.data);
      await this.createOrOverwrite(args.outputPath, compiledDoc, args.overwrite);
      return `Word document ${args.outputPath} successfully created or overwritten.`;
    } catch (error) {
      return JSON.stringify(error);
    }
  }

  // Reading Word document that contains placeholders
  async read(templatePath: string) {
    const template = await fsPromises.readFile(templatePath);
    return template;
  }

  // Compiling the document
  compile(template: any, data: any) {
    const zip = new PizZip(template);
    const builder = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });
    builder.render(data);
    return builder.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    });
  }

  // Saving the content to a new document
  async createOrOverwrite(
    outputPath: string,
    content: Buffer,
    overwrite = false
  ) {
    if (!overwrite && fs.existsSync(outputPath)) {
      throw new Error('File already exists and overwrite flag is not set.');
    }
    await fsPromises.mkdir(dirname(outputPath), { recursive: true });
    await fsPromises.writeFile(outputPath, content);
  }
}
