import { Action } from "../interfaces/action";
import Agent from "@/agents/agent";
import express from 'express';
    import { Server } from 'socket.io';
    import { createServer, Server as HttpServer } from 'http';
import cors from 'cors';

export default class WebsocketAction implements Action {
  agent: Agent;
  name = "websocket_server";
  description = "Starts a websocket server for real-time communication with the agent.";
  arguments = [
    {
      name: "htmlContent",
      type: "string",
      required: true,
      description: "The HTML content to be served on the root endpoint",
    }
  ];

  constructor(agent: Agent) {
    this.agent = agent;
  }

  async run(args: { htmlContent: string }): Promise<any> {
    try {
    

    const app = express();
    app.use(cors());
    const server: HttpServer = createServer(app);
    const io: Server = new Server(server,  {
        cors: {
          origin: "*",  // Allow any origin
          methods: ["GET", "POST"],
          credentials: true
        }
      });

    app.get('/', (req, res) => {
        res.send(args.htmlContent);
    });

    io.on('connection', (socket: any) => {
        console.log('a user connected');

        socket.on('agent_request', async (data: any) => {
            let responseFromAgent = await this.processAgentRequest(data);
            socket.emit('agent_response', responseFromAgent);
        });

        socket.on('disconnect', () => {
            console.log('user disconnected');
        });
    });

    server.listen(3000, () => {
        console.log('Websocket server started on *:3000');
    });

      return `Websocket server started on *:3000`;

    } catch (err) {
      console.error(err);
      throw new Error("Failed to start the websocket server");
    }
  }

  async processAgentRequest(data: any) {
    data = JSON.parse(data);
    const response = await this.agent.model.predict({
        model: 'gpt-4',
        messages: data
    });
    return response.text;
  }
}
