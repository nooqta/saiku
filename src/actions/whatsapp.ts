import { Action } from "@/interfaces/action";
import { Client } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import Agent from "@/agents/agent";
import { LLM } from "@/interfaces/llm";

export default class WhatsAppAction implements Action {
    dependencies = ["whatsapp-web.js","qrcode-terminal"];
  name = "whatsapp";
  description = "Send and reply to WhatsApp messages using OpenAI";
  parameters =[
    // Define the arguments as needed, for example:
    {
      name: "recipient",
      type: "string",
      required: false,
      description: "The recipient's WhatsApp number.",
    },
    {
      name: "messageToSend",
      type: "string",
      required: false,
      description: "The message you want to send.",
    },
    {
      name: "prompt",
      type: "string",
      required: false,
      description: "The prompt you want to send to OpenAI.",
    },
  ];
  model: LLM;
  client: any;

  constructor(agent: Agent) {
    this.agent = agent;
    this.model = this.agent.model;
  }
  agent: Agent;

  async initializeWhatsApp() {
    console.log("Initializing WhatsApp client...");
    if (this.agent.services?.whatsApp) {
      this.client = this.agent.services.whatsApp;
    } else {
      this.client = new Client({
        puppeteer: {
          headless: false,
          args: ["--no-sandbox"],
        },
      });

      this.client.on("qr", (qr: any) => {
        console.log("QR RECEIVED", qr);
        qrcode.generate(qr, { small: true });
      });

      this.client.on("ready", () => {
        console.log("WhatsApp client is ready!");
        this.agent.services.whatsApp = this.client;
      });

      this.client.on("message", this.handleIncomingMessage.bind(this));

      this.client.on("error", (error: any) => {
        console.error("An error occurred:", error);
      });

      await this.client.initialize();
    }
  }

  async handleIncomingMessage(message: any) {
    const sender = message.from.split("@")[0];
    let prompt = `
        ${message.prompt}\n
        `;
    this.model
      .predict({
        messages: [{ role: "system", content: prompt }],
        model: "gpt-3.5-turbo",
      })
      .then((response: any) => {
        const reply = response;
        message.reply(reply);
      })
      .catch((error: any) => {
        console.log(error);
      });
  }

  async run(args: any): Promise<string> {
    try {
      if (!this.client) {
        await this.initializeWhatsApp();
      }

      const { recipient, messageToSend, prompt } = args;
      console.log(args);
      if (args.messageToSend && args.recipient) {
        await this.client.sendMessage(`${recipient.replace('+', '')}@c.us`, messageToSend);
        return "Message sent!";
      }
      return "WhatsApp client is running, awaiting messages.";
    } catch (error) {
      console.log(error);
      return JSON.stringify(error);
    }
  }
}
