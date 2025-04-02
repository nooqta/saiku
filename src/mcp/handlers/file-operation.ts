/**
 * MCP File Operation Tool Handler
 * 
 * This handler provides file operations (read, write, append, delete)
 */

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import fs from 'fs';
import path from 'path';

/**
 * Register the file operation tool to an MCP server
 * 
 * @param server The MCP server instance
 */
export function registerFileOperationTool(server: McpServer): void {
  // File operations tool
  server.tool(
    "file-operation",
    {
      operation: z.enum(["read", "write", "append", "delete"]).describe("File operation to perform"),
      path: z.string().describe("File path"),
      content: z.string().optional().describe("Content to write (for write/append operations)"),
    },
    async ({ operation, path: filePath, content }) => {
      try {
        let result = "";
        
        // Resolve path to make it absolute if it's not already
        const resolvedPath = path.isAbsolute(filePath) 
          ? filePath 
          : path.resolve(process.cwd(), filePath);
        
        switch (operation) {
          case "read":
            result = await fs.promises.readFile(resolvedPath, 'utf-8');
            break;
          case "write":
            if (!content) throw new Error("Content is required for write operation");
            
            // Create directory if it doesn't exist
            const dir = path.dirname(resolvedPath);
            if (!fs.existsSync(dir)) {
              await fs.promises.mkdir(dir, { recursive: true });
            }
            
            await fs.promises.writeFile(resolvedPath, content, 'utf-8');
            result = `File written successfully: ${resolvedPath}`;
            break;
          case "append":
            if (!content) throw new Error("Content is required for append operation");
            await fs.promises.appendFile(resolvedPath, content, 'utf-8');
            result = `Content appended successfully to ${resolvedPath}`;
            break;
          case "delete":
            await fs.promises.unlink(resolvedPath);
            result = `File deleted successfully: ${resolvedPath}`;
            break;
        }
        
        return {
          content: [{ type: "text", text: result }]
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true
        };
      }
    }
  );
}