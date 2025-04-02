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
import { LLM } from "../interfaces/llm"; // Changed from @/
import { GoogleVertexAI } from "../llms/googleVertexAI";
import Ollama from "../llms/ollama";
import { HuggingFace } from "../llms/huggingFace";
import { SocketAdapterModel } from "../llms/adapters/socketAdapter";
import MistralModel from "../llms/mistral";
import ClaudeModel from "../llms/claude";
import DeepseekModel from "../llms/deepseek";
// Use the renamed class - Use default import as that's how client.ts exports
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

  // LLM model
  model!: LLM;
  // MCP client - primarily McpClientManager, SimpleMcpClient might be unused now
  mcpClient: McpClientManager | SimpleMcpClient | null = null;

  // Agent properties
  score = 100;
  messages: any[] = [];
  systemMessage = "You are a helpful assistant";

  // Remove functions property (was for legacy actions)
  // functions: { [key: string]: Action } = {};

  // Tools for LLM (will be only MCP tools)
  actions: { [key: string]: any } = {};

  // Agent memory
  memory: any = {
    lastAction: null, // Name of the last action
    lastActionStatus: null, // 'success' or 'failure'
  };

  // Agent state
  objectives: any[] = [];
  options: AgentOptions = {
    actionsPath: "../actions",
    llm: "deepseek",
    useMcp: true // Use MCP by default
  };
  currentObjective: any = null;
  currentMessages: any[] = [];
  services: any = {};

  constructor(options: AgentOptions) {
    // Remove actionPaths logic
    // this.actionPaths = [...this.actionPaths, options.actionsPath || "../actions"];
    this.options = { ...this.options, ...options };
    if (options.systemMessage) {
      this.systemMessage = options.systemMessage;
    }

    // Initialize the LLM
    this.init();

    // --- Remove legacy action loading ---
    // this.loadRequiredLegacyActions();
    this.actions = []; // Start with empty actions until MCP loads
    // --- End Remove legacy action loading ---

    // Instantiate MCP client directly here if enabled
    if (this.options.useMcp !== false && process.env.MCP_DISABLE !== '1') {
        try {
            // Assign path to variable first
            const settingsPath = this.options.mcpSettingsPath;
            if (!settingsPath) {
                throw new Error("MCP Settings Path is missing in agent options.");
            }
            console.log(`[Agent Constructor] Instantiating McpClientManager with settings path: ${settingsPath}`);
            // Pass the variable to the constructor
            // Restore instantiation
            this.mcpClient = new McpClientManager(settingsPath);
        } catch (error: any) {
            console.error(`[Agent Constructor] Failed to instantiate McpClientManager: ${error.message}`);
            this.mcpClient = null; // Ensure it's null if instantiation fails
        }
    } else {
        console.log("[Agent Constructor] MCP is disabled by options or environment variable.");
        this.mcpClient = null;
    }
  }


  /**
   * Asynchronously initializes the agent, ensuring MCP connection is established
   * before proceeding. This should be called after the constructor.
   */
  async initialize() {
    if (this.options.useMcp !== false && process.env.MCP_DISABLE !== '1') {
      console.log("Awaiting MCP initialization...");
      // Call the renamed method
      await this.initializeMcpConnections().catch((error: any) => { // Add type annotation
        // Error is already logged inside initializeMcpConnections
        // We just prevent it from crashing the main initialization if MCP fails
        console.error("[Agent Initialize] Caught error during MCP connection setup:", error?.message);
      });
      console.log("MCP initialization complete (or skipped/failed).");
    } else {
       console.log("MCP initialization skipped (disabled by options or env var).");
    }
  }

  /**
   * Initialize MCP connections using the instantiated client.
   */
  private async initializeMcpConnections() {
    // Check if the client was successfully instantiated in the constructor
    if (this.mcpClient instanceof McpClientManager) {
        try {
            console.log('[Agent] Initializing MCP connections via settings file...');
            // Call the method to connect to all servers defined in settings
            await this.mcpClient.initializeAndConnectServers();
            console.log('[Agent] MCP server initialization process completed.');

            // After initialization attempt, refresh tools based on connected servers
            await this.refreshTools();
        } catch (error) {
            console.error('[Agent] MCP connection initialization error:', error);
            // Optionally nullify the client if connection fails critically
            // this.mcpClient = null;
        }
    } else if (this.mcpClient instanceof SimpleMcpClient) {
        // Handle SimpleMcpClient connection if it's ever used
        try {
            if (!this.mcpClient.isConnected()) {
                // await this.mcpClient.connect(); // Assuming connect method exists
                console.log("[Agent] Simple MCP Client connected (if applicable).");
                await this.refreshTools();
            }
        } catch(initError: any) { // Add type annotation
             console.error('[Agent] Simple MCP Client connection error:', initError);
        }
    } else {
        console.log("[Agent] No valid MCP client instance found for initialization.");
      // Removed throw error; as it was likely a typo from merge conflict
    }
  }

  /**
  // Removed checkServerRunning method as it's no longer needed

  /**
   * Refresh tools based on currently connected MCP servers.
   */
  public async refreshTools() {
    // Load tools from MCP if the manager has active connections
    if (this.mcpClient instanceof McpClientManager && this.mcpClient.hasActiveConnections()) {
        console.log('[Agent] Refreshing tools from connected MCP servers...');
        await this.loadMcpTools(); // loadMcpTools internally calls the new listTools
    } else if (this.mcpClient instanceof SimpleMcpClient && this.mcpClient.isConnected()) { // Check if SimpleMcpClient exists and has isConnected
        // Handle simple client case if necessary
        console.log('[Agent] Refreshing tools (Simple MCP Client)...');
        // Simple client might need its own tool loading logic if different
        await this.loadMcpTools(); // Assuming loadMcpTools works for simple client too
    } else {
        console.log('[Agent] No active MCP connections. Skipping tool refresh.');
    }

    // --- Remove Legacy Action Loading ---
    // --- End Remove Legacy Action Loading ---

    // Get tool definitions (will now only include MCP tools)
    this.actions = await this.getToolDefinitions();

    // Log the available tools
    console.log(`Agent tools refreshed: ${this.actions.length} tools available`);
    return this.actions;
  }

  /**
   * Load available tools from MCP
   */
  private async loadMcpTools() {
    if (!this.mcpClient) return;

    try {
      // Get available tools from MCP, ensuring it's an array
      const mcpToolsResult = await this.mcpClient.listTools();
      const mcpTools = Array.isArray(mcpToolsResult) ? mcpToolsResult : []; // Default to empty array if not an array

      // Display available MCP tools
      this.displayMessage(`_Loaded ${mcpTools.length} MCP tools_`);

      // Load resources as well (they don't become tools but are available to the agent)
      // Add similar safety check if listResources might fail unexpectedly
      try {
        // Add type guard
        if (this.mcpClient instanceof McpClientManager) {
            await this.mcpClient.listResources();
        } else {
            console.log("[Agent loadMcpTools] Skipping listResources for non-SaikuMcpClient.");
        }
      } catch (resError: any) { // Add type annotation
         // Gracefully handle 'Method not found' error for listResources
         if (resError?.code === -32601) {
            // Log a less verbose warning for this specific, expected error
            console.warn(`[MCP Client] Warning: listResources method not found on a server (expected for some servers).`);
         } else {
            // Log other errors fully
            console.error(`Error loading MCP resources: ${resError.message}`, resError);
         }
      }

      // Prompts are also loaded but not shown as tools
      // Add similar safety check if listPrompts might fail unexpectedly
      try {
         // Add type guard
         if (this.mcpClient instanceof McpClientManager) {
            await this.mcpClient.listPrompts();
         } else {
             console.log("[Agent loadMcpTools] Skipping listPrompts for non-SaikuMcpClient.");
         }
      } catch (promptError: any) { // Add type annotation
         // Also gracefully handle 'Method not found' for listPrompts if needed
         if (promptError?.code === -32601) {
             console.warn(`[MCP Client] Warning: listPrompts method not found on a server.`);
         } else if (promptError?.message?.includes('listPrompts aggregation not yet implemented')) {
             // Also handle the specific "not yet implemented" message cleanly
             console.log(`[MCP Client] listPrompts aggregation not yet implemented.`);
         }
         else {
             console.error(`Error loading MCP prompts: ${promptError.message}`, promptError);
         }
      }
    } catch (error: any) {
      console.error(`Error loading MCP tools: ${error.message}`);
    }
  }
  init() {
    const { llm } = this.options;
    switch (llm) {
      case "openai":
        this.model = new OpenAIModel(this, {
          apiKey: process.env.OPENAI_API_KEY,
        });
        break;
      case "deepseek":
        this.model = new DeepseekModel(this, {
          apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY,
        });
        break;
      case "vertexai":
        this.model = new GoogleVertexAI(this, {
          projectId: process.env.GOOGLE_PROJECT_ID,
          apiEndpoint: process.env.GOOGLE_API_ENDPOINT,
          modelId: process.env.GOOGLE_MODEL_ID,
        });
        break;
      case "ollama":
        this.model = new Ollama(this, {
          baseURL: process.env.OLLAMA_BASE_URL,
          model: process.env.OLLAMA_MODEL,
        });
        break;
      case "huggingface":
        this.model = new HuggingFace(this, {
          apiKey: process.env.HUGGINGFACE_API_KEY,
          model: process.env.HUGGINGFACE_MODEL,
        });
        break;
      case "socket":
        this.model = new SocketAdapterModel(this, this.options);
        break;
      case "mistral":
        this.model = new MistralModel(this, {
          apiKey: process.env.MISTRAL_API_KEY,
        });
        break;
      case "claude":
        this.model = new ClaudeModel(this, {
          apiKey: process.env.ANTHROPIC_API_KEY,
        });
        break;
      // @todo: add support for other llms
      default:
        this.model = new DeepseekModel(this, {
          apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY,
        });
        break;
    }
  }

  // --- Remove listen method ---
  // async listen(): Promise<string> { ... }
  // --- End Remove listen method ---


  async think(useFunctionCalls = true): Promise<any> {
    try {
      const systemMessage = {
        role: "user",
        content: `${this.systemMessage}\n${JSON.stringify(await this.sense())}`,
      };
      const messages = [systemMessage, ...this.messages];
      this.currentMessages = messages;

      // Get the latest tool definitions
      // If MCP is available, this will include both MCP tools and legacy actions
      const tools = useFunctionCalls ? await this.getToolDefinitions() : [];

      let decision = await this.model.predict({
        // @ts-ignore
        prompt: this.currentMessages.findLast(
          (message: any) => message.role === "user"
        )?.content,
        messages:
          this.currentMessages.length > 10
            ? [
                this.currentMessages[0],
                ...this.currentMessages.slice(this.currentMessages.length - 10),
              ]
            : this.currentMessages,
        model: this.model.name,
        ...(useFunctionCalls ? { tools, tool_choice: "auto" } : {}),
      });

      return decision;
    } catch (error: any) {
      console.log(`An error occurred: ${error.message}`);
      process.exit(1);
      return error.message;
    }
  }

  // --- Remove speak() and say() methods ---
  // async say(text: string): Promise<void> { ... }
  // async speak(text: string, useLocal = false): Promise<void> { ... }
  // --- End Remove speak() and say() methods ---


  public displayMessage(message: string) {
    marked.setOptions({
      renderer: new TerminalRenderer(),
    });
    console.log(marked(message));
  }

  // --- Remove Method to Load Specific Legacy Actions ---
  // private loadRequiredLegacyActions() { ... }
  // --- End Remove Method ---


  async sense(): Promise<any> {
    return new Promise((resolve) => {
      // @todo: provide more context information
      resolve({
        agent: {
          name: "Saiku",
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
          gitlab: (() => {
            const gitlab: any = {};
            for (const key in process.env) {
              if (key.startsWith("GITLAB_")) {
                gitlab[key.replace("GITLAB_", "")] = process.env[key];
              }
            }
            return gitlab;
          })(),
        },
        ...this.memory,
      });
    });
  }

  async act(actionName: string, args: any): Promise<string> {
    try {
      // Import dynamically to avoid circular dependencies if still needed in utils
      // const { executeWithMcp } = await import('@/mcp/utils'); // Keep if executeWithMcp remains in utils

      // Try executing via MCP first
      let mcpExecuted = false;
      let output = '';
      let executionError: any = null;

      try {
      // Check if MCP client manager exists and has active connections before attempting
      if (this.mcpClient instanceof McpClientManager && this.mcpClient.hasActiveConnections()) {
          this.displayMessage(
            `_Attempting MCP tool execution via manager: **${actionName}**_`
            );
            // Rely on instanceof check to narrow type for executeWithMcp call
            // Restore executeWithMcp call
            output = await executeWithMcp(this.mcpClient, actionName, args);
            await this.updateMemory({
              lastAction: actionName, // Log the action name including server prefix
              lastActionStatus: "success",
            });
            mcpExecuted = true; // Mark as executed via MCP
            return output; // Return successful MCP output
        } else {
             this.displayMessage(
              `_MCP client not available or connected. Skipping MCP execution for **${actionName}**._`
            );
        }
      } catch (mcpError: any) {
        // Capture MCP specific errors
        executionError = mcpError;
        console.error(`MCP execution failed for tool ${actionName}: ${mcpError.message}`);
        // Don't immediately fall back if the error indicates the tool simply wasn't found via MCP
        if (!mcpError.message?.includes('No MCP tool found')) {
           // Log other MCP errors but might still try legacy
           console.log(`Non-'Not Found' MCP Error encountered, will attempt legacy fallback.`);
        } else {
             this.displayMessage(
              `_MCP tool **${actionName}** not found via MCP execution path._`
            );
        }
      }

      // --- Temporarily Disable Legacy Action Fallback ---
      if (!mcpExecuted) {
          // If MCP execution wasn't attempted or failed, report the specific error directly
          let finalErrorMessage = `Action or Tool '${actionName}' failed or was not found via MCP.`; // Default if no specific error
          if (executionError) {
              // Simplify the error message drastically for the LLM
              const missingArgMatch = executionError.message?.match(/"path":\["([^"]+)"\],"message":"Required"/);
              if (missingArgMatch) {
                  // Focus ONLY on the missing argument
                  finalErrorMessage = `Error: Missing required argument: ${missingArgMatch[1]}`;
              } else {
                  // For other errors, provide a generic message for now
                  finalErrorMessage = `Error executing tool '${actionName}'.`;
                  // Log the full error for debugging, but don't send it all to the LLM
                  console.error("Full execution error:", executionError.message);
              }
          }
          this.displayMessage(`_Failed to execute **${actionName}**: ${finalErrorMessage}_`);
          await this.updateMemory({
             lastAction: actionName, // Log the action that failed
             lastActionStatus: "failure",
          });
          return finalErrorMessage; // Return the error, do not attempt legacy fallback
      }
      // --- End Disable Legacy Action Fallback ---

      // This should only be reached if MCP execution succeeded earlier
      return output;
    } catch (error: any) {
       console.error(`Unexpected error in act method for ${actionName}: ${error.message}`);
       return `Unexpected error processing action '${actionName}': ${error.message}`;
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
      ...args,
    };
  }
  async interact(delegate?: boolean): Promise<void | string> {
    return await this.model.interact(delegate);
  }

  /**
   * Get combined tool definitions from MCP and legacy actions
   * This method now ONLY gets MCP tool definitions based on the connected client type.
   */
  async getToolDefinitions(): Promise<any[]> {
    let allTools: any[] = [];

    // Check connection status based on client type
    let isConnected = false;
    if (this.mcpClient instanceof McpClientManager) {
        isConnected = this.mcpClient.hasActiveConnections();
    } else if (this.mcpClient instanceof SimpleMcpClient) {
        isConnected = this.mcpClient.isConnected();
    }

    if (this.mcpClient && isConnected) {
      try {
        // Get MCP tools from the connected client, ensuring it's an array
        const mcpToolsResult = await this.mcpClient.listTools();
        const mcpTools = Array.isArray(mcpToolsResult) ? mcpToolsResult : []; // Default to empty array

        // Filter out tools with invalid names BEFORE mapping and extract base name
        const validMcpTools = mcpTools.map((tool: any) => {
            // Extract base name (part after the last '/')
            const fullName = tool?.name || '';
            const baseName = fullName.substring(fullName.lastIndexOf('/') + 1);
            return { ...tool, name: baseName, fullName: fullName }; // Keep original name as fullName, overwrite name with baseName
        }).filter((tool: any) => {
            // Validate the extracted base name
            // Validate the extracted base name
            const isValid = tool && typeof tool.name === 'string' && /^[a-zA-Z0-9_-]+$/.test(tool.name);
            // if (!isValid) { // Keep the filtering logic, just remove the log
            //     // Log the original full name if filtering
            //     console.warn(`[Agent getToolDefinitions] Filtering out invalid tool (based on base name '${tool.name}'):`, tool.fullName);
            // }
            return isValid;
        });


        // Convert MCP tools to LLM tool format using the base name
        const mcpToolDefinitions = validMcpTools.map((tool: any) => ({
          type: "function",
          function: {
            name: tool.name, // Use the extracted base name
            description: tool.description || `MCP tool: ${tool.fullName}`, // Use full name in description for clarity
            // Parameters schema is already in the right format from MCP
            parameters: tool.inputSchema || tool.schema || { // Use inputSchema if available, fallback to schema
              type: "object",
              properties: {},
              required: []
            }
          }
        }));

        // Set MCP tools as the only available tools
        allTools = mcpToolDefinitions;
        return allTools;
        // Original logic: return [...mcpToolDefinitions, ...legacyTools];
      } catch (error: any) {
        console.error('Error loading MCP tools:', error.message);
        // Fall back to empty list if MCP fails and legacy is disabled
        return [];
      }
    }

    // Return empty list if MCP not available and legacy is disabled
    return [];
    // Original logic: return allTools; // (which would be legacy tools)
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated This method is removed as it relied on legacy actions.
   */
  // getFunctionsDefinitions(): any { ... } // Removed
}

export default Agent;
