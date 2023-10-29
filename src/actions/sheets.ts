import { google } from "googleapis";
import { Action } from "@/interfaces/action";
import Agent from "@/agents/agent";
import { GoogleDrive } from "../services/google";
import dotenv from "dotenv";
dotenv.config();

interface SheetArgs {
  operation: string;
  title?: string;
  sheetId?: string;
  range?: string;
  values?: string[][];
  // ... other properties for sheets ...
}

export default class SheetAction extends GoogleDrive implements Action {
  agent: Agent;
  name = "google_sheet";
  description = "Manage Google Sheets files";
  arguments = [
    {
      name: "operation",
      type: "string",
      required: true,
      enum: ["insert"],
      description: "The operation to perform. Required.",
    },
    {
      name: "title",
      type: "string",
      required: false,
      description: "The title of the sheet. Required for 'insert' operation.",
    },
    {
      name: "sheetId",
      type: "string",
      required: false,
      description:
        "The ID of the sheet to update. Required for 'update' operation.",
    },
    {
      name: "range",
      type: "string",
      required: false,
      description:
        "The A1 notation of the range to update. Required for 'update' operation.",
    },
    {
      name: "values",
      type: "array",
      required: false,
      description:
        "The values to insert into the sheet. Optional for 'insert' operation.",
      items: {
        type: "array",
        items: {
          type: "string",
        },
      },
    },
  ];

  constructor(agent: Agent) {
    super();
    this.agent = agent;
  }

  async run(args: SheetArgs): Promise<any> {
    switch (args.operation) {
      case "insert":
        return this.insertSheet(args);
      case "update":
        return this.updateSheet(args);
      default:
        throw new Error("Invalid operation");
    }
  }

  async updateSheet(args: SheetArgs): Promise<any> {
    try {
      if (!args.sheetId || !args.range || !args.values) {
        throw new Error("Missing required arguments for updating sheet");
      }
      const authClient = await this.authorize([
        "https://www.googleapis.com/auth/drive.file",
      ]);
      const drive = await this.getDrive(authClient);

      const sheets = google.sheets({
        version: "v4",
        auth: await this.authorize([
            "https://www.googleapis.com/auth/spreadsheets",
            ]),
      });
      const response = await sheets.spreadsheets.values.update({
        spreadsheetId: args.sheetId,
        range: args.range,
        valueInputOption: "RAW",
        requestBody: {
          values: args.values,
        },
      });

      return JSON.stringify(response.data);
    } catch (error) {
      console.log(error);
      return JSON.stringify(error);
    }
  }

  async insertSheet(args: SheetArgs): Promise<any> {
    try {
      if (!args.title) {
        throw new Error("Missing required argument: title");
      }
      const authClient = await this.authorize([
        "https://www.googleapis.com/auth/drive.file",
      ]);
      const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
      const drive = await this.getDrive(authClient);
      const fileMetadata = {
        name: args.title,
        parents: [folderId],
        mimeType: "application/vnd.google-apps.spreadsheet",
      };

      const file = await drive.files.create({
        requestBody: fileMetadata,
        fields: "id",
      });
      console.log(args);
      if (args.values) {
        const sheets = google.sheets({
          version: "v4",
          auth: await this.authorize(['https://www.googleapis.com/auth/spreadsheets']),
        });
        const sheetId = file.data.id!;
        const response = await sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: "Sheet1!A1",
          valueInputOption: "RAW",
          requestBody: {
            values: args.values,
          },
        });

        return JSON.stringify(response.data);
      }
    } catch (error) {
      console.log(error);
      return JSON.stringify(error);
    }
  }
}
