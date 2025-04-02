/**
 * MCP Handlers Index
 * 
 * This file exports all MCP handlers for registration with the MCP server
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Import all handler registration functions
import { registerFileOperationTool } from './file-operation';
import { registerHttpRequestTool } from './http-request';
import { registerGitActionTool } from './git-action';
import { registerListFilesTool } from './list-files'; // Import the list-files handler

/**
 * Register all MCP handlers with the server
 * 
 * @param server The MCP server instance
 */
export function registerAllHandlers(server: McpServer): void {
  // Register all handlers
  registerFileOperationTool(server);
  registerHttpRequestTool(server);
  registerGitActionTool(server);
  registerListFilesTool(server); // Register the list-files handler
}
