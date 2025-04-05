import { Action } from "../interfaces/action";
import fs from "fs";
import path from "path";
import { join } from "path";
import { marked } from "marked";
import TerminalRenderer from "marked-terminal";
import OpenAIModel from "../llms/openai";
import dotenv from "dotenv";
import os from "os";
import { AgentOptions, IAgent } from "../interfaces/agent";
import { LLM } from "../interfaces/llm";
import { GoogleVertexAI } from "../llms/googleVertexAI";
import Ollama from "../llms/ollama";
import { ThinkingModule } from "./thinking";
import { ActingModule } from "./acting";
import { SensingModule } from "./sensing";
import { MemoryModule, Message, ShortTermMemory } from "./memory"; // Import interfaces
import { HuggingFace } from "../llms/huggingFace";
import { SocketAdapterModel } from "../llms/adapters/socketAdapter";
import MistralModel from "../llms/mistral";
import ClaudeModel from "../llms/claude";
import DeepseekModel from "../llms/deepseek";
import { Gemini } from "../llms/gemini";
import McpClientManager from "../mcp/client";
import { SimpleMcpClient } from "../mcp/simple-client";
// Import executeWithMcp statically (already relative)
import { executeWithMcp } from "../mcp/utils";

dotenv.config();

class Agent implements IAgent {
  static loadOptions(opts: any = {}) {
    // Determine default settings path based on OS - moved from client constructor
    const homeDir = os.homedir();
    const defaultMcpSettingsPath = path.join(homeDir, 'Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json');

    let defaultOptions = {
      actionsPath: "../actions",
      llm: "deepseek", // Using DeepSeek as the default model
      useMcp: true,  // Use MCP by default
      mcpSettingsPath: defaultMcpSettingsPath // Add default path here
    };
    // Merge passed options first
    defaultOptions = { ...defaultOptions, ...opts };
    // we check if we have a saiku.jon|js file in the current working directory
    if (fs.existsSync(path.join(process.cwd(), "saiku.json"))) {
      // order of precedence: defaultOptions < saiku.json < opts
      const saikuFile = fs.readFileSync(
        path.join(process.cwd(), "saiku.json"),
        "utf-8"
      );
      const saiku = JSON.parse(saikuFile);
      if (saiku.defaultOptions) {
        defaultOptions = {
          ...defaultOptions,
          ...saiku.defaultOptions,
          ...opts,
        };
      }
    }
    // we check if we have a saiku.js file in the current working directory. If so we merge with defaultOptions
    if (fs.existsSync(path.join(process.cwd(), "saiku.js"))) {
      const saikuFile = require(path.join(process.cwd(), "saiku.js"));
      if (saikuFile.defaultOptions) {
        // order of precedence: defaultOptions < saiku.js < opts
        defaultOptions = {
          ...defaultOptions,
          ...saikuFile.defaultOptions,
          ...opts,
        };
      }
    }
    return defaultOptions;
  }

  // LLM model - Keep instance here as it's passed to ThinkingModule
  model!: LLM;
  // MCP client - Keep instance here as it's passed to ActingModule
  mcpClient: McpClientManager | SimpleMcpClient | null = null;
  // Modules
  private thinkingModule: ThinkingModule;
  private actingModule: ActingModule;
  private sensingModule: SensingModule;
  private memoryModule: MemoryModule;

  // Agent properties
  score = 100;
  systemMessage = "You are a helpful assistant";
  actions: { [key: string]: any } = {};

  // Agent state
  objectives: any[] = [];
  options: AgentOptions;
  currentObjective: any = null;
  services: any = {};

  constructor(options: AgentOptions, mcpClientManager?: McpClientManager) {
    const defaultOptions = Agent.loadOptions(options);
    this.options = { ...defaultOptions, ...options };

    if (this.options.systemMessage) {
      this.systemMessage = this.options.systemMessage;
    }

    this.initLlm();

    if (mcpClientManager) {
      console.log("[Agent Constructor] Using provided McpClientManager instance.");
      this.mcpClient = mcpClientManager;
    } else if (this.options.useMcp !== false && process.env.MCP_DISABLE !== '1') {
      try {
        const settingsPath = this.options.mcpSettingsPath;
        if (!settingsPath) {
          const homeDir = os.homedir();
          const defaultPath = path.join(homeDir, 'Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json');
          if (fs.existsSync(defaultPath)) {
            this.options.mcpSettingsPath = defaultPath;
          } else {
            throw new Error("MCP Settings Path is missing and default path not found.");
          }
        }
        const finalSettingsPath = this.options.mcpSettingsPath;
        if (!finalSettingsPath) {
          throw new Error("Failed to determine MCP settings path.");
        }
        console.log(`[Agent Constructor] Instantiating McpClientManager with settings path: ${finalSettingsPath}`);
        this.mcpClient = new McpClientManager(finalSettingsPath);
      } catch (error: any) {
        console.error(`[Agent Constructor] Failed to instantiate McpClientManager: ${error.message}`);
        this.mcpClient = null;
      }
    } else {
      console.log("[Agent Constructor] MCP is disabled or no manager provided.");
      this.mcpClient = null;
    }

    const memoryPersistencePath = path.join(os.homedir(), '.saiku', 'agent_memory.json');
    this.memoryModule = new MemoryModule(memoryPersistencePath);
    this.sensingModule = new SensingModule();
    this.actingModule = new ActingModule(this.mcpClient);
    this.thinkingModule = new ThinkingModule(this.model); // Pass initialized LLM

    this.actions = [];
  }

  // --- Interface Compliance Getters ---
  public get messages(): any[] {
    return this.memoryModule.getMessages();
  }

  public get memory(): any {
    return this.memoryModule.getShortTermMemory();
  }

  public getMemory(): any {
    return this.memoryModule.getShortTermMemory();
  }
  // --- End Interface Compliance Getters ---


  async initialize() {
    if (this.options.useMcp !== false && process.env.MCP_DISABLE !== '1') {
      console.log("Awaiting MCP initialization...");
      await this.initializeMcpConnections().catch((error: any) => {
        console.error("[Agent Initialize] Caught error during MCP connection setup:", error?.message);
      });
      console.log("MCP initialization complete (or skipped/failed).");
    } else {
       console.log("MCP initialization skipped (disabled by options or env var).");
    }
  }

  private async initializeMcpConnections() {
    if (this.mcpClient instanceof McpClientManager) {
        try {
            console.log('[Agent] Initializing MCP connections via settings file...');
            await this.mcpClient.initializeAndConnectServers();
            console.log('[Agent] MCP server initialization process completed.');
            await this.refreshTools();
        } catch (error) {
            console.error('[Agent] MCP connection initialization error:', error);
        }
    } else if (this.mcpClient instanceof SimpleMcpClient) {
        try {
            if (!this.mcpClient.isConnected()) {
                console.log("[Agent] Simple MCP Client connected (if applicable).");
                await this.refreshTools();
            }
        } catch(initError: any) {
             console.error('[Agent] Simple MCP Client connection error:', initError);
        }
    } else {
        console.log("[Agent] No valid MCP client instance found for initialization.");
    }
  }

  public async refreshTools() {
    if (this.mcpClient instanceof McpClientManager && this.mcpClient.hasActiveConnections()) {
        console.log('[Agent] Refreshing tools from connected MCP servers...');
        await this.loadMcpTools();
    } else if (this.mcpClient instanceof SimpleMcpClient && this.mcpClient.isConnected()) {
        console.log('[Agent] Refreshing tools (Simple MCP Client)...');
        await this.loadMcpTools();
    } else {
        console.log('[Agent] No active MCP connections. Skipping tool refresh.');
    }
    this.actions = await this.getToolDefinitions();
    console.log(`Agent tools refreshed: ${this.actions.length} tools available`);
    return this.actions;
  }

  private async loadMcpTools() {
    if (!this.mcpClient) return;
    try {
      const mcpToolsResult = await this.mcpClient.listTools();
      const mcpTools = Array.isArray(mcpToolsResult) ? mcpToolsResult : [];
      this.displayMessage(`_Loaded ${mcpTools.length} MCP tools_`);
      // Load resources and prompts (handle errors gracefully)
      try {
        if (this.mcpClient instanceof McpClientManager) await this.mcpClient.listResources();
      } catch (resError: any) { if (resError?.code !== -32601) console.error(`Error loading MCP resources: ${resError.message}`, resError); }
      try {
         if (this.mcpClient instanceof McpClientManager) await this.mcpClient.listPrompts();
      } catch (promptError: any) { if (promptError?.code !== -32601 && !promptError?.message?.includes('listPrompts aggregation not yet implemented')) console.error(`Error loading MCP prompts: ${promptError.message}`, promptError); }
    } catch (error: any) {
      console.error(`Error loading MCP tools: ${error.message}`);
    }
  }

  initLlm() {
    const { llm } = this.options;
    switch (llm) {
      case "openai":
        this.model = new OpenAIModel(this, { apiKey: process.env.OPENAI_API_KEY });
        break;
      case "deepseek":
        this.model = new DeepseekModel(this, { apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY });
        break;
      case "vertexai":
        this.model = new GoogleVertexAI(this, { projectId: process.env.GOOGLE_PROJECT_ID, apiEndpoint: process.env.GOOGLE_API_ENDPOINT, modelId: process.env.GOOGLE_MODEL_ID });
        break;
      case "ollama":
        this.model = new Ollama(this, { baseURL: process.env.OLLAMA_BASE_URL, model: process.env.OLLAMA_MODEL });
        break;
      case "huggingface":
        this.model = new HuggingFace(this, { apiKey: process.env.HUGGINGFACE_API_KEY, model: process.env.HUGGINGFACE_MODEL });
        break;
      case "socket":
        this.model = new SocketAdapterModel(this, this.options);
        break;
      case "mistral":
        this.model = new MistralModel(this, { apiKey: process.env.MISTRAL_API_KEY });
        break;
      case "claude":
        this.model = new ClaudeModel(this, { apiKey: process.env.ANTHROPIC_API_KEY });
         break;
      case "gemini":
        this.model = new Gemini(this, { apiKey: process.env.GEMINI_API_KEY, modelId: process.env.GEMINI_MODEL_ID });
        break;
       default:
         this.model = new DeepseekModel(this, { apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY });
        break;
    }
  }

  async think(useFunctionCalls = true): Promise<any> {
    const messages = this.memoryModule.getMessagesForLLM();
    const sensedContext = await this.sensingModule.sense();
    const thinkingContext = {
      systemMessage: this.systemMessage,
      messages: messages,
      sensedData: sensedContext,
      availableTools: useFunctionCalls ? await this.getToolDefinitions() : [],
      llmModel: this.model
    };
    try {
      const response: import("../interfaces/llm").PredictionResponse = await this.thinkingModule.think(thinkingContext);
      if (response && response.text) {
          if (typeof response.text === 'object' && response.text.tool_calls) {
              this.memoryModule.addMessage({ role: 'assistant', content: response.text });
          } else if (typeof response.text === 'string') {
              this.memoryModule.addMessage({ role: 'assistant', content: response.text });
          } else {
               console.warn("Received unexpected LLM response structure:", response.text);
               this.memoryModule.addMessage({ role: 'assistant', content: JSON.stringify(response.text) });
          }
      } else {
          console.warn("LLM response or response text was empty.");
          this.memoryModule.addMessage({ role: 'system', content: "[LLM returned empty response]" });
      }
      return response;
    } catch (error: any) {
      console.error(`Error during thinking process: ${error.message}`);
      this.memoryModule.addMessage({ role: 'system', content: `Error during thinking: ${error.message}` });
      return { error: `Thinking failed: ${error.message}` };
    }
  }

  public displayMessage(message: string) {
    marked.setOptions({ renderer: new TerminalRenderer() });
    console.log(marked(message));
  }

  async sense(): Promise<any> {
    const sensedData = await this.sensingModule.sense();
    const shortTermMemory = this.memoryModule.getShortTermMemory();
    return { ...sensedData, shortTermMemory: shortTermMemory };
  }

  async act(actionName: string, args: any): Promise<string> {
    const result = await this.actingModule.act(actionName, args);
    const status = result.startsWith("Error:") ? "failure" : "success";
    this.memoryModule.updateShortTermMemory({
      lastAction: actionName,
      lastActionStatus: status,
    });
     this.memoryModule.addMessage({ role: 'tool', content: result });
    return result;
  }

  evaluatePerformance(): number {
    return this.score;
  }

  // --- Memory Management Delegation ---
  remember(key: keyof ShortTermMemory, value: any): void {
    this.memoryModule.updateShortTermMemory({ [key]: value });
  }

  recall(key: keyof ShortTermMemory): any {
    return this.memoryModule.getShortTermMemory()[key];
  }

  forget(key: keyof ShortTermMemory): void {
    this.memoryModule.updateShortTermMemory({ [key]: null });
  }

  saveMemory(): void {
    console.warn("Agent.saveMemory() is deprecated; MemoryModule handles persistence.");
  }

  updateMemory(args: Partial<ShortTermMemory>): void {
    this.memoryModule.updateShortTermMemory(args);
  }

  addMessage(message: Message): void {
    this.memoryModule.addMessage(message);
  }

  async interact(delegate?: boolean): Promise<void | string> {
    console.warn("Agent.interact() might need replacement by a proper sense-think-act loop.");
    return await this.model.interact(delegate);
  }

  /**
   * Processes a user request by running the sense-think-act loop.
   */
  async processUserRequest(userInput: string): Promise<string | any> {
    this.addMessage({ role: 'user', content: userInput });
    let maxTurns = 10;
    let turn = 0;

    while (turn < maxTurns) {
      turn++;
      this.displayMessage(`\n--- Turn ${turn} ---`);
      const decisionResponse = await this.think(true);

      if (decisionResponse?.error) {
        this.displayMessage(`Error during thinking: ${decisionResponse.error}`);
        return `Error: ${decisionResponse.error}`;
      }

      const assistantContent = decisionResponse?.text;

      if (typeof assistantContent === 'object' && assistantContent?.tool_calls) {
         const toolCalls = assistantContent.tool_calls; // Assign directly inside the block
         this.displayMessage(`_Requesting tool execution: ${toolCalls.map((t: any) => t.function?.name || 'unknown').join(', ')}_`);

         if (toolCalls.length > 0) { // Check length directly
            const toolCall = toolCalls[0]; // No need for non-null assertion
            const toolName = toolCall.function?.name;
            const toolArgs = toolCall.function?.arguments;

            if (toolName && toolArgs) {
              try {
                const parsedArgs = JSON.parse(toolArgs);
                this.displayMessage(`_Executing tool: **${toolName}** with args: ${JSON.stringify(parsedArgs)}_`);
                const toolResult = await this.act(toolName, parsedArgs);
                this.displayMessage(`_Tool Result: ${toolResult}_`);
              } catch (e: any) {
                console.error(`Error parsing tool arguments or executing tool ${toolName}:`, e);
                this.addMessage({ role: 'tool', content: `Error processing tool ${toolName}: ${e.message}` });
                this.displayMessage(`_Error executing tool ${toolName}: ${e.message}_`);
              }
            } else {
               this.displayMessage(`_Invalid tool call structure received: ${JSON.stringify(toolCall)}_`);
               this.addMessage({ role: 'system', content: `[Received invalid tool call structure]` });
            }
         } else {
            this.displayMessage("No tool calls found, but expected. Ending turn.");
            return assistantContent || "[No response and no tool call]";
         }
      } else {
         this.displayMessage(`Assistant Response: ${assistantContent}`);
         return assistantContent;
      }
    }

    this.displayMessage("Maximum interaction turns reached.");
    return "Max turns reached.";
  }


  /**
   * Get combined tool definitions from MCP and legacy actions
   * This method now ONLY gets MCP tool definitions based on the connected client type.
   */
  async getToolDefinitions(): Promise<any[]> {
    let allTools: any[] = [];
    let isConnected = false;
    if (this.mcpClient instanceof McpClientManager) {
        isConnected = this.mcpClient.hasActiveConnections();
    } else if (this.mcpClient instanceof SimpleMcpClient) {
        isConnected = this.mcpClient.isConnected();
    }

    if (this.mcpClient && isConnected) {
      try {
        const mcpToolsResult = await this.mcpClient.listTools();
        const mcpTools = Array.isArray(mcpToolsResult) ? mcpToolsResult : [];
        const validMcpTools = mcpTools.filter((tool: any) => tool && typeof tool.name === 'string' && tool.name.includes('/'));

        const sanitizeSchemaForGemini = (schema: any): any => ({ type: "object", properties: {} });

        const mcpToolDefinitions = validMcpTools.map((tool: any) => {
            const fullName = tool.name;
            const baseName = fullName.substring(fullName.lastIndexOf('/') + 1);
            const llmCompatibleBaseName = baseName.replace(/[^a-zA-Z0-9_]/g, '_');
            return {
                type: "function",
                function: {
                    name: llmCompatibleBaseName,
                    description: tool.description || `MCP tool: ${fullName}`,
                    parameters: sanitizeSchemaForGemini(tool.inputSchema || tool.schema)
                },
                fullName: fullName
            };
        }).filter(toolDef => /^[a-zA-Z0-9_]+$/.test(toolDef.function.name));

        allTools = mcpToolDefinitions;
        return allTools;
      } catch (error: any) {
        console.error('Error loading MCP tools:', error.message);
        return [];
      }
    }
    return [];
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated This method is removed as it relied on legacy actions.
   */
  // getFunctionsDefinitions(): any { ... } // Removed
}

export default Agent;
