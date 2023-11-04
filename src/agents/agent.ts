import { Action } from "../interfaces/action";
import fs from "fs";
import path from "path";
import { join } from "path";
import { marked } from "marked";
import TerminalRenderer from "marked-terminal";
import OpenAIModel from "../llms/openai";
import dotenv from 'dotenv'; 
import os from 'os';
import { AgentOptions, IAgent } from "../interfaces/agent";
import { LLM } from "@/interfaces/llm";
import { GoogleVertexAI } from "../llms/googleVertexAI";
import Ollama from "../llms/ollama";
import { HuggingFace } from "../llms/huggingFace";
import { SocketAdapterModel } from "../llms/adapters/socketAdapter";

dotenv.config();


class Agent implements IAgent {
  // @todo: use llm instead and allow the user to specify the model
  model!: LLM;
  score = 100;
  messages: any[] = [];
  systemMessage = 'You are a helpful assistant';
  functions: { [key: string]: Action } = {};
  actions: { [key: string]: any } = {};
  memory: any = {
    lastAction: null,  // Name of the last action
    lastActionStatus: null,  // 'success' or 'failure'
  }; // A basic representation of agent's memory. Can be replaced with a more sophisticated data structure.
  objectives: any[] = []; // Agent's objectives.
  options: AgentOptions = { actionsPath: "", llm: "OpenAI" };
  currentObjective: any = null; // The current objective that the agent is trying to achieve.
  currentMessages: any[] = [];
  services: any = {};

  constructor(options: AgentOptions) {
    this.options = options;
    if (options.systemMessage) {
      this.systemMessage = options.systemMessage;
    }
    this.init();
    // Load actions from the specified actionsPath.
    this.loadFunctions(options.actionsPath);
    this.actions = this.getFunctionsDefinitions();
  }
  init() {
    const {llm} = this.options;
    switch (llm) {
      case 'openai':
        this.model = new OpenAIModel(this,{
          apiKey: process.env.OPENAI_API_KEY,
        })
        break;
      case 'vertexai':
        this.model = new GoogleVertexAI(this,{
          projectId: process.env.GOOGLE_PROJECT_ID,
          apiEndpoint: process.env.GOOGLE_API_ENDPOINT,
          modelId: process.env.GOOGLE_MODEL_ID,
        });
        break;
      case 'ollama':
        this.model = new Ollama(this,{
          baseURL: process.env.OLLAMA_BASE_URL,
          model: process.env.OLLAMA_MODEL,
        });
        break;
      case 'huggingface':
        this.model = new HuggingFace(this,{
          apiKey: process.env.HUGGINGFACE_API_KEY,
          model: process.env.HUGGINGFACE_MODEL,
        });
        break;
      case 'socket':
        this.model = new SocketAdapterModel(this, this.options);
        break;
      // @todo: add support for other llms
      default:
          this.model = new OpenAIModel(this,{
          apiKey: process.env.OPENAI_API_KEY,
          
        })
        break;
    } 
  }
  
  

  async listen(): Promise<string> {
    return await this.functions["speech_to_text"].run({});
  }

  async think(useFunctionCalls = true): Promise<any> {
    try {
      const systemMessage = {
        role: "system",
        content: `${this.systemMessage}\n${JSON.stringify(await this.sense())}`,
      };
      const messages = [systemMessage, ...this.messages];
      this.currentMessages = messages;
      const functions = this.actions;

      let decision = await this.model.predict({
        // @ts-ignore
          prompt: this.currentMessages.findLast((message:any) => message.role === 'user')?.content,
        messages:
          this.currentMessages.length > 10
            ? [
                this.currentMessages[0],
                ...this.currentMessages.slice(this.currentMessages.length - 10),
              ]
            : this.currentMessages,
        model: this.model.name,
        ...(useFunctionCalls ? { functions: functions } : {})
  
      });
  
      return decision;
      
    } catch (error) {
      // @ts-ignore
      console.log(`An error occurred: ${error.message}`)
      // @ts-ignore
      return error.message;
    }
  }

  async speak(text: string, useLocal = false): Promise<void> {

    if(!useLocal) {
    // We request openai to suggest a text that can be spoken
    const response = await this.model.predict({
      messages: [
        {
          role: "system",
          content: `
          Generate a Siri-friendly speech from the following text, capturing all key points while omitting or rephrasing unsuitable content.          `,
        },
        {
          role: "user",
          content: text,
        }
      ],
      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
      max_tokens: 64,
      temperature: 0.8,
    }); // Add 'as any' to bypass the type checking error
    text = response.text || text;
  }
    if (os.platform() === 'darwin') {
      // we use execute_code action and Siri to speak the text
      await this.functions["execute_code"].run({ code: `say "${text}"`, language: 'applescript' });
      // @todo: add support for other platforms
    } else {
    const filename =  await this.functions["text_to_speech"].run({ text });
    // play audio file
    const player = require("play-sound")(({}));
    await player.play(filename)
    }
  }

  public displayMessage(message: string) {
    marked.setOptions({
      renderer: new TerminalRenderer(),
    });
    console.log(marked(message));
  }
  private loadFunctions(actionsPath: string) {
    let actionFiles = fs.readdirSync(
      join(path.resolve(__dirname, actionsPath))
    );
    const activatedActions = ['execute_code', 'chat', 'websocket_server'];
    // check if we have a .saiku file
    if (fs.existsSync(path.join(actionsPath, 'saiku'))) {
      const saikuFile = fs.readFileSync(path.join(actionsPath, 'saiku'), 'utf-8');
      const saiku = JSON.parse(saikuFile);
      if (saiku.activatedActions) {
        activatedActions.push(...saiku.activatedActions);
      }
    }
    // filter actions and load
    actionFiles = actionFiles.filter((file) => {
      const actionClass = require(path.join(actionsPath, file)).default;
      const actionInstance: Action = new actionClass(this);
      return activatedActions.includes(actionInstance.name);
    });
    
    actionFiles.forEach((file) => {
      const actionClass = require(path.join(actionsPath, file)).default;
      const actionInstance: Action = new actionClass(this);
      this.functions[actionInstance.name] = actionInstance;
    });
  }
  public getAllFunctions() {
    const actionFiles = fs.readdirSync(
      join(path.resolve(__dirname, this.options.actionsPath))
    );
    const functions : Action[]=[] ;
    actionFiles.forEach((file) => {
      const actionClass = require(path.join(this.options.actionsPath, file)).default;
      const actionInstance: Action = new actionClass(this);
      functions.push(actionInstance);
    });
    return functions
  }

  async sense(): Promise<any> {
    return new Promise((resolve) => {
      // @todo: provide more context information
      resolve({
        agent: {
          name: 'Saiku'
        },
        os: process.platform,
        arch: process.arch,
        version: process.version,
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        uptime: process.uptime(),
        // provide date and time
        date: new Date().toLocaleDateString(),
        start_time: new Date().toLocaleTimeString(),
        // provide location information
        cwd: process.cwd(),
        // provide information about the current user
        current_user: {
          name: process.env.ME,
          country: process.env.COUNTRY,
          city: process.env.CITY,
          company: process.env.COMPANY,
          phone: process.env.PHONE,
        },
        api_services: {
          weather: process.env.WEATHER_API_KEY,
          gitlab: {
            version: process.env.GITLAB_VERSION,
            username: process.env.GITLAB_USERNAME,
            api_version: process.env.GITLAB_API_VERSION,
          }
        },
        ...this.memory,
      });
    });
  }


  async act(actionName: string, args: any): Promise<string> {
    try { 
    const action = this.functions[actionName];
    this.displayMessage(
      `_Executing action **${actionName}: ${action.description}**_`
    );
    if (action) {
      try {
        // @ts-ignore
        const output = await action.run(args);
        await this.updateMemory({
          lastAction: actionName,
          lastActionStatus: "success",
        });
        return output;
      } catch (error) {
        await this.updateMemory( {
          lastAction: actionName,
          lastActionStatus: "failure",
        });
        return JSON.stringify(error);

      }

    } else {
      this.displayMessage(`No action found with name: **${actionName}**`);
      return "Action not found";
    }
  } catch (error) {
      return JSON.stringify(error);
  }
  }

  evaluatePerformance(): number {
    // Evaluate the agent's performance based on its objectives.
    // Returns a score. For now, we return a placeholder value.
    return this.score;
  }

  // manage the agent's memory
  remember(key: string, value: any): void {
    this.memory[key] = value;
  }

  recall(key: string): any {
    return this.memory[key];
  }

  forget(key: string): void {
    delete this.memory[key];
  }
  saveMemory(): void {
    // we save the agent's memory to a file
    fs.writeFileSync(
      path.join(__dirname, "../data/memory.json"),
      JSON.stringify(this.memory)
    );
  }
  getMemory(): any {
    // @todo: we retrieve the agent's memory and long-term memory
    return this.memory;
  }

  updateMemory(args: any): any {
    this.memory = {
      ...this.memory,
      ...args
    }
  }
  async interact(delegate?: boolean): Promise<void|string> {
    return await this.model.interact(delegate);
  }

  getFunctionsDefinitions(): any {
    const actions = Object.values(this.functions).map((action) => ({
      name: action.name,
      description: action.description,
      arguments: action.arguments,
    }));
    return actions.map((action: any) => ({
      name: action.name,
      description: action.description,
      parameters: {
        type: "object",
        properties: action.arguments.reduce((acc: any, arg: any) => {
          acc[arg.name] = { type: arg.type };
          if (arg.description) {
            acc[arg.name].description = arg.description;
          }
          if (arg.type === "array" && arg.items) {
            // Include items if the type is array and items is defined
            acc[arg.name].items = arg.items;
          }
          return acc;
        }, {}),
      },
      required: action.arguments
        .filter((arg: any) => arg.required)
        .map((arg: any) => arg.name),
    }));
  }
}

export default Agent;
