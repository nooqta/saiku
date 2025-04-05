// src/agents/acting.ts
// This module will handle the execution of tools (primarily MCP tools).
import McpClientManager from "../mcp/client"; // Adjust path as needed
import { SimpleMcpClient } from "../mcp/simple-client"; // Adjust path as needed
import { executeWithMcp } from "../mcp/utils"; // Adjust path as needed

export class ActingModule {
  private mcpClient: McpClientManager | SimpleMcpClient | null;

  constructor(mcpClient: McpClientManager | SimpleMcpClient | null) {
    this.mcpClient = mcpClient;
  }

  async act(toolName: string, args: any): Promise<string> {
    console.log(`ActingModule.act called with tool: ${toolName}, args:`, args);

    if (!this.mcpClient) {
      return `Error: MCP Client not available. Cannot execute tool ${toolName}.`;
    }

    // Ensure the client is the expected type for executeWithMcp
    if (!(this.mcpClient instanceof McpClientManager)) {
       // Or handle SimpleMcpClient if executeWithMcp supports it, otherwise return error
       return `Error: Unsupported MCP client type for tool execution. Cannot execute tool ${toolName}.`;
    }


    try {
      // Assuming executeWithMcp handles finding the full tool name and execution
      const output = await executeWithMcp(this.mcpClient, toolName, args);
      return output;
    } catch (error: any) {
      console.error(`Error executing tool ${toolName} via MCP:`, error);
      // Simplify error for the agent/LLM
      const missingArgMatch = error.message?.match(/"path":\["([^"]+)"\],"message":"Required"/);
      if (missingArgMatch) {
          return `Error: Missing required argument for ${toolName}: ${missingArgMatch[1]}`;
      }
      return `Error executing tool '${toolName}'. Check logs for details.`;
    }
  }
}
