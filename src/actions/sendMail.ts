import { Action } from "../interfaces/action";
import nodemailer from "nodemailer";
import dotenv from 'dotenv'; 
dotenv.config();
export default class SendEmailAction implements Action {
  name = "send_email";
  description = "Send an email";
  arguments = [
    { name: "to", type: "string", required: true },
    { name: "subject", type: "string", required: true },
    { name: "text", type: "string", required: true },
    {
      name: "attachments",
      type: "array",
      required: false,
      items: { type: "string" },
    },
  ];

  async run(args: {
    to: string;
    subject: string;
    text: string;
    attachments?: string[];
  }): Promise<any> {
    // Destructure arguments
    const { to, subject, text, attachments } = args;

    // Validate arguments
    if (!to || !subject || !text) {
      throw new Error("To, subject, and text are required");
    }
    try {
    // @todo: make this configurable
    const mailgunTransport = require("nodemailer-mailgun-transport");
    // Configure transport options
const mailgunOptions ={
            host: 'smtp.mailgun.org',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false
              }
        }

    // create reusable transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport(mailgunOptions);
    // Prepare the email options
    const mailOptions: any = {
      from: process.env.DISPLAY_FROM_EMAIL,
      to: to,
      subject: subject,
      html: text,
      text: text,
    };

    // If attachments are provided, include them in the email options
    if (attachments) {
      mailOptions.attachments = attachments.map((filename) => {
        return { path: filename, filename };
      });
    }
      // send mail with defined transport object
      const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
      return JSON.stringify(info);
    } catch (error: any) {
        console.log("An error occured while sending the message: %s", error?.message|| '');
      return JSON.stringify(error);
    }
  }
}
