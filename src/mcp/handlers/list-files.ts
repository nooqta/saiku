/**
 * MCP List Files Tool Handler
 *
 * Provides directory listing capabilities.
 */

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import fs from 'fs';
import path from 'path';

/**
 * Register the list-files tool to an MCP server
 *
 * @param server The MCP server instance
 */
export function registerListFilesTool(server: McpServer): void {
  server.tool(
    "list-files", // Specific tool name
    {
      // Define input schema using Zod
      directory_path: z.string().optional().describe("The path to the directory to list. Defaults to the current working directory if omitted."),
      // Optional: Add recursive flag if needed later
      // recursive: z.boolean().optional().default(false).describe("Whether to list files recursively.")
    },
    async ({ directory_path }) => {
      try {
        const targetPath = directory_path
          ? (path.isAbsolute(directory_path) ? directory_path : path.resolve(process.cwd(), directory_path))
          : process.cwd(); // Default to CWD

        if (!fs.existsSync(targetPath)) {
            throw new Error(`Directory not found: ${targetPath}`);
        }
        if (!fs.lstatSync(targetPath).isDirectory()) {
             throw new Error(`Path is not a directory: ${targetPath}`);
        }

        const files = await fs.promises.readdir(targetPath, { withFileTypes: true });

        const listing = files.map(file => ({
          name: file.name,
          isDirectory: file.isDirectory(),
          isFile: file.isFile(),
          // Construct full path for clarity, might be useful for subsequent operations
          path: path.join(targetPath, file.name)
        }));

        // Return a user-friendly string list for the LLM
        const fileListString = listing.map(f => `${f.name}${f.isDirectory ? '/' : ''}`).join('\n');

        return {
          content: [{ type: "text", text: `Files in ${targetPath}:\n${fileListString}` }]
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Error listing files: ${error.message}` }],
          isError: true
        };
      }
    }
  );
}
