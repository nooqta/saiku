import { Action } from "@/interfaces/action";
import fetch from "node-fetch";
import dotenv from 'dotenv'; 
import Agent from "@/agents/agent";
dotenv.config();

export default class TrelloAction implements Action {
  agent: Agent;
  name = "trelloAction";
  description = "Interact with Trello to list cards, add cards, or search across boards, cards, and members based on a query.";
  arguments = [
    {
      name: "action",
      type: "string",
      required: true,
      description: "The action to perform (listCards | addCard | search)",
    },
    {
      name: "listId",
      type: "string",
      required: false,
      description: "The ID of the list to interact with",
    },
    {
      name: "cardName",
      type: "string",
      required: false,
      description: "The name of the card to add (required for addCard action)",
    },
    {
      name: "cardDesc",
      type: "string",
      required: false,
      description: "The description of the card to add (optional)",
    },
    {
      name: "query",
      type: "string",
      required: false,
      description: `The search query (required for search action). Use search operators to refine your query:
      - -operator: Add “-” to any operator for a negative search, e.g., -has:members for cards without any members assigned.
      - @name: Returns cards assigned to a member. @me for cards you’re a member of.
      - board:name: Returns cards within a specific board. board:id also works.
      - created:day: Returns cards created in the last 24 hours. Use created:week or created:month for longer durations.
      - description:, checklist:, comment:, and name: Match text in card descriptions, checklists, comments, or names.
      - due:day: Returns cards due within 24 hours. due:week, due:month, and due:overdue also work.
      - edited:day: Returns cards edited in the last 24 hours. Use edited:week or edited:month for longer durations.
      - has:attachments: Returns cards with attachments. Other options include has:description, has:cover, has:members, and has:stickers.
      - is:open: Returns open cards. 
      - is:starred: Only include cards on starred boards.
      - label: Return cards with a specific label. Use label:labelcolor, #labelcolor, or #labelname.
      - list:name: Returns cards within the list named “name”.
      - sort: Returns cards sorted by creation date, due date, or edited date. Use sort:created, sort:due, sort:edited, sort:-edited.`,
    },
    {
      name: "modelTypes",
      type: "string",
      required: true,  // Set to true as it must be set, but has a default value
      default: "actions",  // Default value
      enum: ["actions", "boards", "cards", "members", "organizations", "plugins"],  // Enum values
      description: "Types of models to search for. Defaults to actions.",
    },
];


  constructor(agent: Agent) {
    this.agent = agent;
  }

  async run(args: any): Promise<string> {
    const { action, listId, cardName, cardDesc, query } = args;
    let { modelTypes } = args;
    const apiKey = process.env.TRELLO_API_KEY;
    const apiToken = process.env.TRELLO_API_TOKEN;

    if (!apiKey || !apiToken) {
      throw new Error("Trello credentials are not set!");
    }

    try {
      if (action === "listCards") {
        return await this.listCards(apiKey, apiToken, listId);
      } else if (action === "addCard" && cardName) {
        return await this.addCard(apiKey, apiToken, listId, cardName, cardDesc);
      } else if (action === "search" && query) {
        if(!modelTypes) modelTypes = "actions,boards,cards,members";
        return await this.search(apiKey, apiToken, query, modelTypes);
      } else {
        throw new Error("Invalid action or missing required arguments!");
      }
    } catch (error) {
      console.log(error);
      throw new Error(`Trello API request failed: ${error}`);
    }
  }

  private async request(
    endpoint: string,
    method: string = "GET",
    body?: object
  ): Promise<any> {
    const url = `https://api.trello.com/1/${endpoint}`;
    console.log(`Making ${method} request to ${url}`);
    const options: any = {
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`Trello API request failed: ${response.statusText}`);
    }
    return response.json();
  }

  private async listCards(
    apiKey: string,
    apiToken: string,
    listId: string
  ): Promise<string> {
    const cards = await this.request(
      `lists/${listId}/cards?key=${apiKey}&token=${apiToken}`
    );
    return JSON.stringify(cards.map((card: any) => ({
        id: card.id,
        name: card.name, 
        desc: card.desc,
        url: card.shortUrl,
        lastActivity: card.dateLastActivity

    }))
        , null, 2);
  }

  private async addCard(
    apiKey: string,
    apiToken: string,
    listId: string,
    name: string,
    desc?: string
  ): Promise<string> {
    const card = await this.request(
      `cards?key=${apiKey}&token=${apiToken}`,
      "POST",
      { idList: listId, name, desc }
    );
    return `Card added with ID: ${card.id}`;
  }

  private async search(
    apiKey: string,
    apiToken: string,
    query: string,
    modelTypes?: string
  ): Promise<string> {
    const endpoint = `search?key=${apiKey}&token=${apiToken}&query=${encodeURIComponent(query)}&modelTypes=${modelTypes || ''}`;
    const result = await this.request(endpoint);
    return JSON.stringify(result, null, 2);
  }
}