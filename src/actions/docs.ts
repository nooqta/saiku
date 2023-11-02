import Agent from "../agents/agent";
import { Action } from "@/interfaces/action";
import { GoogleDrive } from "../services/google";
import dotenv from 'dotenv'; 
dotenv.config();

export default class GoogleDocsAction extends GoogleDrive implements Action {
  dependencies = ['dotenv','googleapis','google-auth-library'];
    agent: Agent;
    name = 'google_docs';
    description = 'Create, update, and manage Google Docs documents';
    arguments = [
      {
        name: 'operation',
        type: 'string',
        required: true,
        enum: ['insert'],
        description: 'The operation to perform. Required.',
      },
      {
        name: 'title',
        type: 'string',
        required: true,
        description: 'The title of the document. Required for insert operation.',
      },
      {
        name: 'content',
        type: 'string',
        required: false,
        description: 'The content of the document. Optional for insert operation.',
      },
    ];

    constructor(agent: Agent) {
        super();
        this.agent = agent;
        }
  
    async run(args: any): Promise<any> {
      switch (args.operation) {
        case 'insert':
          return this.insertDocument(args);
        default:
          throw new Error('Invalid operation');
      }
    }
  
    async insertDocument(args: any): Promise<any> {
      try {
        const authClient = await this.authorize(['https://www.googleapis.com/auth/drive.file']);
        const drive = await this.getDrive(authClient);
        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
        const fileMetadata = {
          name: args.title,
            parents: [folderId],
          mimeType: 'application/vnd.google-apps.document',
        };
        
        const media = {
          mimeType: 'text/plain',
          body: args.content || '',
        };
        
        const response = await drive.files.create({
          requestBody: fileMetadata,
          media: media,
        });
        
        return JSON.stringify(response.data);
      } catch (error) {
        console.log(error);
        return JSON.stringify(error);
      }
    }
  }
  