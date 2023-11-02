import fs from 'fs';
import path from 'path';
import process from 'process';
import { Action } from "@/interfaces/action";
import Agent from "@/agents/agent";
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const SERVICE_ACCOUNT_KEY_PATH = path.join(process.cwd(), 'credentials.json');

interface CalendarArgs {
  organizer?: string;
  creator?: string;
  operation: 'update' | 'list' | 'delete' | 'insert';
  eventId?: string;
  start?: string;
  end?: string;
  timeZone?: string;
  summary?: string;
  location?: string;
  description?: string;
  attendees?: Array<{ email: string }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{ method: string; minutes: number }>;
  };
  // ... any other properties from the documentation ...
}

  export default class CalendarAction implements Action {
    static dependencies = ["googleapis","google-auth-library"];
  agent: Agent;
  name = "calendar_action";
  description = "Manage Google Calendar events";
  arguments = [
    {
      name: "operation",
      type: "string",
      required: true,
      enum: ['update', 'list', 'delete', 'insert'],
      description: "The operation to perform. Required."
    },
    {
      name: "eventId",
      type: "string",
      required: false,
      description: "The ID of the event to update or delete. Required for 'update' and 'delete' operations."
    },
    {
      name: "organizer",
      type: "string",
      required: false,
      description: "The email address of the organizer. Optional for both 'update' and 'insert' operations."
    },
    {
      name: "creator",
      type: "string",
      required: false,
      description: "The email address of the creator. Optional for both 'update' and 'insert' operations."
    },
    {
      name: "summary",
      type: "string",
      required: false,
      description: "The summary or title of the event. Required for 'insert' operation, optional for 'update' operation."
    },
    {
      name: "start",
      type: "string",
      required: false,
      description: "The start time of the event in ISO 8601 format. Required for 'insert' operation, optional for 'update' operation."
    },
    {
      name: "end",
      type: "string",
      required: false,
      description: "The end time of the event in ISO 8601 format. Required for 'insert' operation, optional for 'update' operation."
    },
    {
      name: "timeZone",
      type: "string",
      required: false,
      description: "The time zone of the event. Optional for both 'update' and 'insert' operations.",
      default: "Africa/Tunis"
    },
  ];
  

  constructor(agent: Agent) {
    this.agent = agent;
  }

  async run(args: CalendarArgs): Promise<any> {
    switch (args.operation) {
      case 'update':
        return this.updateEvent(args);
      case 'list':
        return this.listEvents();
      case 'delete':
        return this.deleteEvent(args);
      case 'insert':
        return this.insertEvent(args);
      default:
        throw new Error('Invalid operation');
    }
  }

  async insertEvent(args: CalendarArgs): Promise<any> {
    try {
      const authClient = await this.authorize();

      const calendar = google.calendar({ version: 'v3', auth: authClient });
  
    args.timeZone = args.timeZone || 'Africa/Tunis';  // Use provided timeZone or default to 'Africa/Tunis'
    // Ensure required arguments are provided
    if (!args.summary || !args.start || !args.end) {
      throw new Error('Missing required arguments for inserting event');
    }

    const event = {
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      summary: args.summary,
      start: {
        dateTime: args.start,
        timeZone: args.timeZone || 'Africa/Tunis',  // Use provided timeZone or default to 'Africa/Tunis'
      },
      end: {
        dateTime: args.end,
        timeZone: args.timeZone || 'Africa/Tunis',  // Use provided timeZone or default to 'Africa/Tunis'
      },
      organizer: {
        email: args.organizer || 'me',
      },
      creator: {
        email: args.creator || 'me',
      },
      sendUpdates: 'all'
    };
      const response = await calendar.events.insert({
        calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
        requestBody: event,
      });
      
      return JSON.stringify(response.data);
    } catch (error) {
      console.log(error);
      return JSON.stringify(error);
    }
  }

  async updateEvent(args: CalendarArgs): Promise<any> {
    const auth = await this.authorize();
    const calendar = google.calendar({ version: 'v3', auth });
    const updatedEvent = {
      summary: args.summary,
      organizer: args.organizer ? { email: args.organizer } : undefined,
      creator: args.creator ? { email: args.creator } : undefined,
      start: {
        dateTime: args.start,
        timeZone: args.timeZone || 'Africa/Tunis',
      },
      end: {
        dateTime: args.end,
        timeZone: args.timeZone || 'Africa/Tunis',
      },
    };

    try {
      const response = await calendar.events.update({
        calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
        eventId: args.eventId!,
        requestBody: updatedEvent,
      });
      return JSON.stringify(response.data);
    } catch (error) {
      return JSON.stringify(error);
    }
  }

  async listEvents(): Promise<any> {
    const auth = await this.authorize();
    const calendar = google.calendar({ version: 'v3', auth });

    try {
      const res = await calendar.events.list({
        calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
        timeMin: new Date().toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
      });
      const events = res.data.items;
      if (!events || events.length === 0) {
        return 'No upcoming events found.';
      }
      return events.map((event: any) => {
        const start = event.start.dateTime || event.start.date;
        return `${start} - ${event.summary}`;
      });
    } catch (error) {
      return JSON.stringify(error);
    }
  }


  async deleteEvent(args: CalendarArgs): Promise<any> {
    const auth = await this.authorize();
    const calendar = google.calendar({ version: 'v3', auth });

    try {
      const response = await calendar.events.delete({
        calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
        eventId: args.eventId!,
      });
      return JSON.stringify(response.data);
    } catch (error) {
      return JSON.stringify(error);
    }
  }


  async authorize(): Promise<JWT> {
    const serviceAccountKey = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_KEY_PATH, 'utf-8'));
    const jwtClient = new JWT(
      serviceAccountKey.client_email,
      undefined,
      serviceAccountKey.private_key,
      SCOPES,
    );
    await jwtClient.authorize();
    return jwtClient;
  }
}
