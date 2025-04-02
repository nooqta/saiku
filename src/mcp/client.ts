/**
 * MCP Client implementation for Saiku
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { ChildProcess, spawn } from "child_process";
import path from "path";
import fs from "fs";
import os from "os"; // Needed for home directory

// --- MCP Settings Types (Simplified) ---
interface McpServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
  disabled?: boolean;
  autoApprove?: string[]; // Assuming this might be relevant later
}

interface McpSettings {
  mcpServers: Record<string, McpServerConfig>;
}
// --- End MCP Settings Types ---


// Define types for MCP responses
interface McpContent {
  type: string;
  text: string;
}

interface McpToolResponse {
  content: McpContent[];
  isError?: boolean;
}

interface McpResourceContent {
  uri: string;
  text: string;
}

interface McpResourceResponse {
  contents: McpResourceContent[];
}

interface McpPromptMessage {
  role: string;
  content: McpContent[];
}

interface McpPromptResponse {
  messages: McpPromptMessage[];
}

interface McpResourceDefinition {
  scheme: string;
  description?: string;
}

interface McpToolDefinition {
  name: string;
  description?: string;
}

interface McpPromptDefinition {
  name: string;
  description?: string;
}

// Rename class to McpClientManager
export class McpClientManager {
  // Store multiple clients, transports, and processes
  private clients: Map<string, Client> = new Map();
  private transports: Map<string, StdioClientTransport> = new Map();
  private serverProcesses: Map<string, ChildProcess> = new Map();
  private settingsFilePath: string;

  constructor(settingsFilePath: string) {
    if (!settingsFilePath) {
        // Handle case where no path is provided - maybe throw error or use a default?
        // For now, let's throw an error to make configuration explicit.
            throw new Error("[MCP Client Constructor] MCP Settings File Path is required.");
        }
        this.settingsFilePath = settingsFilePath;
        // console.log(`[MCP Client] Initialized with settings file path: ${this.settingsFilePath}`); // Removed log
    }


  /**
   * Reads MCP settings and connects to all enabled servers.
   */
  async initializeAndConnectServers(): Promise<void> {
    // console.log('[MCP Client] Initializing and connecting servers...'); // Removed log
    let settings: McpSettings | null = null;

    // 1. Read Settings File
    try {
      if (fs.existsSync(this.settingsFilePath)) {
        const settingsContent = fs.readFileSync(this.settingsFilePath, 'utf-8');
        settings = JSON.parse(settingsContent) as McpSettings;
        // console.log(`[MCP Client] Loaded settings for ${Object.keys(settings.mcpServers).length} server(s).`); // Removed log
      } else {
        // console.warn(`[MCP Client] Settings file not found at ${this.settingsFilePath}. No servers will be started.`); // Keep warn? Maybe remove. Removed for now.
        return; // No settings, nothing to connect to
      }
    } catch (error: any) {
      console.error(`[MCP Client] Error reading or parsing settings file ${this.settingsFilePath}:`, error);
      // Decide if we should proceed without servers or throw
      return; // Stop initialization if settings are invalid
    }

    if (!settings || !settings.mcpServers) {
        // console.log('[MCP Client] No mcpServers found in settings.'); // Removed log
        return;
    }

    // 2. Iterate and Connect
    const connectionPromises: Promise<void>[] = [];
    for (const serverName in settings.mcpServers) {
      const config = settings.mcpServers[serverName];

      if (config.disabled) {
        // console.log(`[MCP Client] Server "${serverName}" is disabled. Skipping.`); // Removed log
        continue;
      }

      // Start connection attempt for each enabled server
      connectionPromises.push(this.connectToServer(serverName, config));
    }

    // Wait for all connection attempts to settle
    await Promise.allSettled(connectionPromises);

    // console.log(`[MCP Client] Finished connection attempts. ${this.clients.size} server(s) connected.`); // Removed log
  }

  /**
   * Connects to a single MCP server based on its configuration.
   */
  private async connectToServer(serverName: string, config: McpServerConfig): Promise<void> {
     // console.log(`[MCP Client] Attempting to connect to server: "${serverName}"...`); // Removed log
     try {
        // Filter process.env to remove undefined values before merging
        const filteredProcessEnv: Record<string, string> = {};
        for (const key in process.env) {
            if (process.env[key] !== undefined) {
                filteredProcessEnv[key] = process.env[key]!;
            }
        }

        // Create Transport
        const transport = new StdioClientTransport({
            command: config.command,
            args: config.args,
            env: { ...filteredProcessEnv, ...config.env }, // Merge filtered env vars
            cwd: process.cwd(), // Or maybe determine CWD differently?
            stderr: 'inherit' // Revert to inherit stderr to see server logs again
        });

        transport.onerror = (error) => {
            console.error(`[MCP Client] Transport error for "${serverName}":`, error); // Keep error
            // Maybe attempt reconnect or mark server as disconnected
            this.cleanupServer(serverName);
        };
        transport.onclose = () => {
            // console.log(`[MCP Client] Transport closed for "${serverName}".`); // Removed log
            this.cleanupServer(serverName); // Ensure cleanup on close
        };

        // Create Client
        const client = new Client(
            { name: `Saiku-Client-for-${serverName}`, version: "1.0.0" },
            { capabilities: {} } // Capabilities will be discovered
        );

        // Connect
        await client.connect(transport);

        // Store successful connection
        this.clients.set(serverName, client);
        this.transports.set(serverName, transport);
        // Note: Accessing the underlying process might be needed for cleanup
        // The SDK's transport might not expose it directly, requiring potential adjustments
        // or assumptions about how the transport manages the process.
        // For now, we assume transport.close() handles termination.

        // console.log(`[MCP Client] Successfully connected to server: "${serverName}"`); // Removed log

     } catch (error: any) {
        console.error(`[MCP Client] Failed to connect to server "${serverName}":`, error.message); // Keep error
        // Ensure partial resources are cleaned up if connection fails mid-way
        this.cleanupServer(serverName); // Attempt cleanup even on failure
     }
  }


  /**
   * Disconnects from all connected MCP servers.
   */
  async disconnectAll(): Promise<void> {
    // console.log('[MCP Client] Disconnecting from all servers...'); // Removed log
    const cleanupPromises: Promise<void>[] = [];
    for (const serverName of this.clients.keys()) {
        cleanupPromises.push(this.cleanupServer(serverName));
    }
    await Promise.allSettled(cleanupPromises);
    // console.log('[MCP Client] Finished disconnecting all servers.'); // Removed log
  }

  /**
   * Cleans up resources for a specific server.
   */
  private async cleanupServer(serverName: string): Promise<void> {
    // console.log(`[MCP Client] Cleaning up resources for server "${serverName}"...`); // Removed log
    const client = this.clients.get(serverName);
    const transport = this.transports.get(serverName);
    const process = this.serverProcesses.get(serverName); // If we store processes

    // Close transport first
    if (transport) {
        try {
            await transport.close();
        } catch (error) {
            console.error(`[MCP Client] Error closing transport for "${serverName}":`, error);
        }
    }

    // Terminate process if stored and potentially lingering
    if (process && !process.killed) {
        // console.log(`[MCP Client] Terminating process for server "${serverName}" (PID: ${process.pid})...`); // Removed log
        process.kill('SIGTERM'); // Or SIGKILL if necessary
        // Consider adding a timeout and force kill
    }

    // Remove from maps
    this.clients.delete(serverName);
    this.transports.delete(serverName);
    this.serverProcesses.delete(serverName); // If we store processes
    // console.log(`[MCP Client] Finished cleanup for server "${serverName}".`); // Removed log
  }


  /**
   * List available resources from all connected servers.
   */
  async listResources(): Promise<McpResourceDefinition[]> {
    let allResources: McpResourceDefinition[] = [];
    // console.log('[MCP Client] Listing resources from all connected servers...'); // Removed log

    for (const [serverName, client] of this.clients.entries()) {
        try {
            const response = await client.listResources();
            const resources = (response?.resources || []) as unknown as McpResourceDefinition[];
            // console.log(`[MCP Client] Found ${resources.length} resources on server "${serverName}".`); // Removed log
            // Optionally, prefix or tag resources with serverName if URIs might collide
            allResources = allResources.concat(resources);
        } catch (error) {
            // console.error(`[MCP Client] Error listing resources from server "${serverName}":`, error); // Keep error? Maybe only if verbose flag
            // Continue to next server
        }
    }
    // console.log(`[MCP Client] Total resources found across all servers: ${allResources.length}`); // Removed log
    return allResources;
  }

  /**
   * Read a resource by URI. Determines the correct server based on the URI scheme
   * or requires a serverName hint if schemes collide or are ambiguous.
   * TODO: Implement server routing based on URI or add serverName parameter.
   */
  async readResource(uri: string /*, serverName?: string */): Promise<McpResourceResponse> {
     // Placeholder: Needs logic to find the right server client based on URI scheme
     // For now, just try the first client found, which is incorrect.
     const firstClient = this.clients.values().next().value;
     if (!firstClient) {
         throw new Error("No connected MCP servers to read resource from.");
     }
     // console.warn(`[MCP Client] readResource currently uses the first available server. Implement proper routing.`); // Removed log
     try {
        // Cast needed because TypeScript definitions don't match the actual API
        return await firstClient.readResource(uri as any) as unknown as McpResourceResponse;
     } catch (error) {
        console.error(`Error reading resource ${uri}:`, error);
        throw error;
     }
  }

  /**
   * List available tools from all connected servers.
   */
  async listTools(): Promise<McpToolDefinition[]> {
    let allTools: McpToolDefinition[] = [];
    // console.log('[MCP Client] Listing tools from all connected servers...'); // Removed log

    for (const [serverName, client] of this.clients.entries()) {
        try {
            const response = await client.listTools();
            let tools = (response?.tools || []) as unknown as McpToolDefinition[];
            // console.log(`[MCP Client] Found ${tools.length} tools on server "${serverName}".`); // Removed log
            // Add serverName prefix to tool names to avoid collisions
            tools = tools.map(tool => ({ ...tool, name: `${serverName}/${tool.name}` }));
            allTools = allTools.concat(tools);
        } catch (error) {
            // console.error(`[MCP Client] Error listing tools from server "${serverName}":`, error); // Keep error? Maybe only if verbose flag
            // Continue to next server
        }
    }
    // console.log(`[MCP Client] Total tools found across all servers: ${allTools.length}`); // Removed log
    return allTools;
  }


  /**
   * Call a tool on a specific server.
   * Tool name should be prefixed with server name, e.g., "serverName/toolName".
   */
  async callTool(prefixedName: string, args: Record<string, any>): Promise<McpToolResponse> {
    const separatorIndex = prefixedName.indexOf('/');
    if (separatorIndex === -1) {
        throw new Error(`Invalid tool name format: "${prefixedName}". Expected "serverName/toolName".`);
    }
    const serverName = prefixedName.substring(0, separatorIndex);
    const toolName = prefixedName.substring(separatorIndex + 1);

    const client = this.clients.get(serverName);
    if (!client) {
        throw new Error(`[MCP Client] No connected server found with name: "${serverName}"`);
    }

    // console.log(`[MCP Client] Calling tool "${toolName}" on server "${serverName}"...`); // Removed log
    try {
      // Cast needed because TypeScript definitions don't match the actual API
      return await client.callTool({
        name: toolName, // Use the original tool name for the server
        arguments: args
      } as any) as unknown as McpToolResponse;
    } catch (error) {
      console.error(`[MCP Client] Error calling tool "${toolName}" on server "${serverName}":`, error);
      throw error; // Keep throwing actual errors
    }
  }

  /**
   * List available prompts from all connected servers.
   * TODO: Implement prompt listing aggregation similar to listTools.
   */
  async listPrompts(): Promise<McpPromptDefinition[]> {
    // console.warn("[MCP Client] listPrompts aggregation not yet implemented."); // Removed log
    // Placeholder implementation
    return [];
    // Implementation should iterate clients, call listPrompts, aggregate,
    // and potentially prefix names like listTools.
  }

  /**
   * Get a prompt by name from a specific server.
   * Name should be prefixed like "serverName/promptName".
   * TODO: Implement prompt getting similar to callTool.
   */
  async getPrompt(prefixedName: string, args: Record<string, any> = {}): Promise<McpPromptResponse> {
     // console.warn("[MCP Client] getPrompt not yet implemented for multiple servers."); // Removed log
     // Placeholder implementation
     const separatorIndex = prefixedName.indexOf('/');
     if (separatorIndex === -1) throw new Error("Invalid prompt name format.");
     const serverName = prefixedName.substring(0, separatorIndex);
     const promptName = prefixedName.substring(separatorIndex + 1);
     const client = this.clients.get(serverName);
     if (!client) throw new Error(`Server "${serverName}" not found.`);
     // Actual call would be:
     // return await client.getPrompt({ name: promptName }, args as any) as unknown as McpPromptResponse;
     throw new Error("getPrompt not implemented yet");
  }

  /**
   * Get a specific MCP client instance by server name.
   */
  getClient(serverName: string): Client | undefined {
    return this.clients.get(serverName);
  }

  /**
   * Get all connected client instances.
   */
  getAllClients(): Map<string, Client> {
      return this.clients;
  }

  /**
   * Check if the manager has any active server connections.
   */
  hasActiveConnections(): boolean {
    return this.clients.size > 0;
  }

  /**
   * Get the status of connected servers.
   */
  getServerStatus(): Record<string, { connected: boolean }> {
      const status: Record<string, { connected: boolean }> = {};
      // Assume all servers in the clients map are connected
      for (const serverName of this.clients.keys()) {
          status[serverName] = { connected: true };
      }
      // Could potentially add servers from settings that failed to connect
      // by comparing settings keys with client keys.
      return status;
  }
}

// Update exports - Just use the class export and default export
export default McpClientManager;
