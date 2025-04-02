/**
 * MCP Utilities
 * 
 * Provides utility functions for interacting with MCP servers
 */

// Use regular imports as they are needed for instanceof checks
import  SaikuMcpClient  from "./client";
import { SimpleMcpClient } from "./simple-client";

// Define interfaces for tool mappings
interface ToolMapping {
  tool: string;
  transformArgs?: (args: any) => any;
}

// Remove Singleton MCP client instances and related logic
// let mcpClient: SaikuMcpClient | null = null;
// let simpleMcpClient: SimpleMcpClient | null = null;
// let useSimpleClient = false;

// Map of legacy action names to MCP tool names and argument transformers (keep this)
const actionToToolMapping: Record<string, ToolMapping> = {
  // Code execution
  'execute_code': { 
    tool: 'execute-code',
    transformArgs: (args: any) => ({
      language: args.language,
      code: args.code
    })
  },
  
  // File operations
  'file_action': {
    tool: 'file-operation',
    transformArgs: (args: any) => ({
      operation: args.operation,
      path: args.filename,
      content: args.content
    })
  },
  
  // HTTP requests
  'http_request': {
    tool: 'http-request',
    transformArgs: (args: any) => ({
      url: args.url,
      method: args.method || 'GET',
      headers: args.headers || {},
      body: args.body
    })
  },
  
  // Shell commands
  'command': {
    tool: 'shell-command',
    transformArgs: (args: any) => ({
      command: args.command
    })
  },
  
  // Add more mappings as needed for other actions
};

/**
// Remove getMcpClient function

/**
 * Execute an action using MCP tools via the provided client instance.
 * This function provides backward compatibility with the action system.
 *
 * @param client The SaikuMcpClient (manager) or SimpleMcpClient instance.
 * @param actionName The action name to execute (may be legacy or MCP format).
 * @param args The arguments for the action.
 * @returns The result of the tool execution.
 */
export async function executeWithMcp(
    client: SaikuMcpClient | SimpleMcpClient, // Accept either type
    actionName: string,
    args: any
): Promise<string> {

    // Check if the provided client has active connections
    if (client instanceof SaikuMcpClient && !client.hasActiveConnections()) {
        console.error('executeWithMcp called but MCP client manager has no active connections.');
        throw new Error('MCP client manager has no active connections');
    } else if (client instanceof SimpleMcpClient && !client.isConnected()) {
        console.error('executeWithMcp called but Simple MCP client is not connected.');
        throw new Error('Simple MCP client not connected');
    } else if (!client) {
        // Added check if client is null/undefined (though type signature prevents null)
        console.error('executeWithMcp called with no valid MCP client instance.');
        throw new Error('No valid MCP client instance provided');
    }

    // Determine the correct tool name and arguments
    let toolName: string;
    let toolArgs: any;
    const mapping = actionToToolMapping[actionName]; // Check mapping only once

    if (mapping) {
        // Use mapped tool name and transform args if needed
        toolName = mapping.tool;
        toolArgs = mapping.transformArgs ? mapping.transformArgs(args) : args;
        console.log(`Mapping found for '${actionName}'. Using MCP tool: '${toolName}'`);
    } else {
        // No mapping, try converting legacy action_name to MCP tool-name
        toolName = actionName.replace(/_/g, '-');
        toolArgs = args;
        console.log(`No mapping for '${actionName}'. Attempting direct MCP tool call: '${toolName}'`);
        // Note: If the LLM calls with the already converted name (e.g., 'git-action'),
        // this conversion won't hurt, but it won't find a mapping either.
    }

    try {
        // Attempt the determined tool call
        const result = await client.callTool(toolName, toolArgs);

        // Extract the text content from the result if successful
        // Check if result and result.content exist and have length
        if (result?.content?.length > 0 && typeof result.content[0]?.text === 'string') {
          return result.content[0].text;
        } else {
          // If no text content, return a string representation of the result
          console.warn(`MCP tool '${toolName}' executed but returned no text content. Result:`, result);
          return JSON.stringify(result ?? {}); // Return stringified result or empty object
        }

    } catch (error: any) {
        // If the call fails for any reason (tool not found, invalid args, execution error),
        // log it and re-throw the original error with context.
        console.error(`Error executing MCP tool '${toolName}' (called for action '${actionName}'):`, error);
        // Ensure a meaningful error message is thrown
        throw new Error(error.message || `MCP execution failed for tool '${toolName}'`);
    }
}

/**
 * Disconnect the provided MCP client instance.
 */
export async function disconnectMcpClient(client: SaikuMcpClient | SimpleMcpClient | null): Promise<void> {
    if (!client) {
        console.log("disconnectMcpClient called with no client instance.");
        return;
    }

    if (client instanceof SaikuMcpClient && client.hasActiveConnections()) {
        try {
            console.log("Disconnecting all MCP servers via manager...");
            await client.disconnectAll();
        } catch (error: any) {
            console.error('Error disconnecting MCP client manager:', error.message);
        }
    } else if (client instanceof SimpleMcpClient && client.isConnected()) {
        try {
            console.log("Disconnecting Simple MCP client...");
            await client.disconnect();
        } catch (error: any) {
            console.error('Error disconnecting Simple MCP client:', error.message);
        }
    } else {
        console.log("MCP client already disconnected or not applicable type.");
    }
}

// Remove setUseSimpleClient function

/**
 * Register a new action-to-tool mapping
 * 
 * @param actionName The legacy action name
 * @param toolName The MCP tool name
 * @param transformFn Optional function to transform arguments
 */
export function registerToolMapping(
  actionName: string, 
  toolName: string, 
  transformFn?: (args: any) => any
): void {
  actionToToolMapping[actionName] = {
    tool: toolName,
    transformArgs: transformFn
  };
}
