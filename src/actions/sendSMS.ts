import Agent from "@/agents/agent";
import { Action } from "@/interfaces/action";
import { Twilio } from "twilio";
import dotenv from 'dotenv'; 
dotenv.config();
export default class SendSMSTwilioAction implements Action {
    agent: Agent;
    name = "sendSMSTwilio";
    description = "Send an SMS using Twilio";
    arguments = [
        { name: "to", type: "string", required: true, description: "The phone number to send the SMS to." },
        { name: "body", type: "string", required: true, description: "The content of the SMS message." },
        { name: "from", type: "string", required: true, description: "The Twilio phone number to send the SMS from." }
    ];

    constructor(agent: Agent) {
        this.agent = agent;
    }

    async run(args: any): Promise<string> {
        const { to, body, from } = args;

        // These should be stored securely and retrieved when needed
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;

        if (!accountSid || !authToken) {
            throw new Error("Twilio credentials are not set!");
        }

        const client = new Twilio(accountSid, authToken);

        // Send the SMS
        const message = await client.messages.create({
            to: to,
            body: body,
            from: from,
        });

        return `Message sent with SID: ${message.sid}`;
    }
}
