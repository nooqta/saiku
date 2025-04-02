/**
 * Standalone MCP Server Entry Point
 * 
 * This file exports a standalone MCP server that can be started directly or via the client.
 * It follows MCP protocol exactly as documented.
 */

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js"; // Import ResourceTemplate
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
// Import necessary schemas from SDK types
import {
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  ReadResourceRequestSchema,
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { registerAllHandlers } from './handlers';

async function main() {
  try {
    // Create a new MCP server
    const server = new McpServer({
      name: "Saiku-MCP",
      version: "1.0.0"
    });
    
    // Register core tools built-in to the server
    server.tool(
      "execute-code",
      {
        language: z.string().describe("Programming language to execute"),
        code: z.string().describe("Code to execute")
      },
      async ({ language, code }) => {
        // Simple implementation for demo
        return {
          content: [{ 
            type: "text", 
            text: `Executed ${language} code: ${code.slice(0, 20)}...` 
          }]
        };
      }
    );
    
    // Register a file resource
    server.resource(
      "file",
      "file:///example.txt",
      async (uri) => {
        return {
          contents: [{
            uri: uri.href,
            text: "Example file content"
          }]
        };
      }
    );

    // Add a dummy prompt registration to enable the listPrompts handler
    server.prompt(
        "dummy-prompt",
        "A placeholder prompt",
        () => ({ messages: [] }) // Simple implementation
    );

    // McpServer should handle ListTools, ListResources, ListPrompts automatically
    // based on registered .tool(), .resource(), .prompt() calls.
    // Remove the manual setRequestHandler calls for these.

    // Register all modular handlers
    registerAllHandlers(server);


    // Check if we should use stdio transport (default) or another transport
    if (process.argv.includes('--stdio')) {
      console.error("Configuring stdio transport...");
      // Use stdio transport
      const transport = new StdioServerTransport();
      console.error("Stdio transport created. Attempting server.connect...");
      try {
        await server.connect(transport);
        console.error("server.connect(transport) completed successfully."); // Log success
      } catch (connectError) {
        console.error("Error during server.connect(transport):", connectError); // Log connection error
        throw connectError; // Re-throw to be caught by outer try/catch
      }
      console.error("MCP Server setup with stdio transport seems complete."); // Final log if connect didn't throw
    } else {
      console.error("Configuring HTTP transport...");
      // If not using stdio, start the TCP server transport (much more reliable)
      // Import TCP transport dynamically to avoid import errors when not used
      // This requires installing express: npm install express
      try {
        const express = require('express');
        const app = express();
        
        // Add CORS headers
        app.use((req: any, res: any, next: any) => {
          res.header('Access-Control-Allow-Origin', '*');
          res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
          next();
        });
        
        // Add a simple health check endpoint
        app.get('/health', (req: any, res: any) => {
          res.send({ status: 'ok' });
        });
        
        // Start the HTTP server
        const PORT = process.env.MCP_PORT || 3333;
        app.listen(PORT, () => {
          console.error(`MCP Server started on port ${PORT}`);
        });
      } catch (error) {
        console.error("Failed to start HTTP transport:", error);
        // Fall back to stdio if HTTP fails
        const transport = new StdioServerTransport();
        const fallbackTransport = new StdioServerTransport();
        console.error("Fallback: Attempting server.connect with stdio transport...");
        try {
            await server.connect(fallbackTransport);
            console.error("Fallback: server.connect(transport) completed successfully.");
        } catch (fallbackConnectError) {
            console.error("Fallback: Error during server.connect(transport):", fallbackConnectError);
            throw fallbackConnectError;
        }
        console.error("Fallback: MCP Server setup with stdio transport seems complete.");
      }
    }
  } catch (error) {
    console.error("Error starting MCP server:", error);
    process.exit(1);
  }
}

// Only run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

// Otherwise export for importing
export default main;
