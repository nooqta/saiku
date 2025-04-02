/**
 * MCP Git Action Tool Handler
 *
 * Provides Git command execution capabilities.
 */

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { spawn } from 'child_process';
import path from 'path';

// Helper function to execute shell commands safely
async function executeShellCommand(command: string, cwd: string = process.cwd()): Promise<string> {
  return new Promise((resolve, reject) => {
    // Use spawn for better control over arguments and potential escaping issues
    const parts = command.split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    const process = spawn(cmd, args, { cwd, shell: true }); // Use shell: true for complex commands if needed, but be cautious

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        // Combine stdout and stderr for error context
        const errorOutput = `Exit Code: ${code}\nStderr: ${stderr.trim()}\nStdout: ${stdout.trim()}`;
        reject(new Error(errorOutput));
      }
    });

    process.on('error', (err) => {
      reject(err); // Handle spawn errors (e.g., command not found)
    });
  });
}


/**
 * Register the git action tool to an MCP server
 *
 * @param server The MCP server instance
 */
export function registerGitActionTool(server: McpServer): void {
  server.tool(
    "git-action", // Tool name (matches legacy action name if possible)
    {
      // Define input schema using Zod
      command: z.string().describe("The git command to execute (e.g., 'status', 'log -n 5', 'add .')"),
      // Optional: Add working directory if needed, defaults to server's CWD
      // cwd: z.string().optional().describe("Working directory for the command")
    },
    async ({ command /*, cwd */ }) => {
      try {
        // Basic security check: prevent potentially dangerous commands
        // This is a very simple check and might need refinement
        const forbiddenCommands = ['rm -rf', '>', '<', '|', ';', '&&', '||'];
        if (forbiddenCommands.some(fc => command.includes(fc))) {
            throw new Error(`Execution of potentially dangerous command sequence is forbidden: ${command}`);
        }

        // Ensure the command starts with 'git'
        if (!command.trim().startsWith('git')) {
            throw new Error("Command must start with 'git'");
        }

        // Execute the git command
        const result = await executeShellCommand(command /*, cwd */);

        return {
          content: [{ type: "text", text: result }]
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Error executing git command: ${error.message}` }],
          isError: true
        };
      }
    }
  );
}
