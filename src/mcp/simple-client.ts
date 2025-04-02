/**
 * Simple MCP client implementation
 * This is a simplified version that avoids some of the complexities of the full implementation
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import fs from "fs";

export class SimpleMcpClient {
  private client: Client;
  private transport: StdioClientTransport | null = null;
  private connected: boolean = false;
  
  constructor() {
    this.client = new Client(
      { name: "Saiku-Simple-Client", version: "1.0.0" },
      { capabilities: { resources: {}, tools: {}, prompts: {} } }
    );
  }
  
  /**
   * Connect to a server script path
   */
  async connect(serverPath?: string): Promise<void> {
    try {
      // Use provided server path or find the server script
      let mcpServerPath = serverPath;
      
      if (!mcpServerPath) {
        // Try different potential locations for server.js
        const possiblePaths = [
          path.join(__dirname, 'server.js'),                          // Built version
          path.join(__dirname, '../src/mcp/server.js'),               // Development version
          path.join(process.cwd(), 'dist/mcp/server.js'),             // From project root
          path.join(process.cwd(), 'src/mcp/server.js')               // From project root source
        ];
        
        // Find the first path that exists
        for (const potentialPath of possiblePaths) {
          if (fs.existsSync(potentialPath)) {
            mcpServerPath = potentialPath;
            break;
          }
        }
        
        // If no path was found, throw an error
        if (!mcpServerPath) {
          throw new Error('MCP server script not found in any expected location');
        }
      }
      
      console.log(`Starting MCP server from: ${mcpServerPath}`);
      
      // Create transport using the SDK's expected interface
      this.transport = new StdioClientTransport({
        command: 'node',
        // Add the --stdio flag to ensure the spawned server uses the correct transport
        args: [mcpServerPath, '--stdio']
      });
      
      // Add error handling for better diagnostics
      this.transport.onerror = (error) => {
        console.error("MCP transport error:", error);
      };
      
      // Connect to the server
      await this.client.connect(this.transport);
      this.connected = true;
      console.log('Connected to MCP server');
    } catch (error) {
      await this.disconnect();
      throw error;
    }
  }
  
  /**
   * Disconnect and cleanup
   */
  async disconnect(): Promise<void> {
    if (this.transport) {
      try {
        await this.transport.close();
      } catch (error) {
        console.error('Error closing transport:', error);
      } finally {
        this.transport = null;
        this.connected = false;
      }
    }
  }
  
  /**
   * List available tools
   */
  async listTools(): Promise<any[]> {
    if (!this.connected) {
      throw new Error('Not connected to MCP server');
    }
    
    const result = await this.client.listTools();
    // Cast to any to avoid type errors
    return result as unknown as any[];
  }
  
  /**
   * Call a tool
   */
  async callTool(name: string, args: Record<string, any>): Promise<any> {
    if (!this.connected) {
      throw new Error('Not connected to MCP server');
    }
    
    return await this.client.callTool({
      name,
      arguments: args
    } as any);
  }
  
  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }
}

// Simple test function to check if the client works
export async function testSimpleClient(): Promise<void> {
  const client = new SimpleMcpClient();
  
  try {
    await client.connect();
    console.log('Connected successfully!');
    
    const tools = await client.listTools();
    console.log(`Available tools: ${tools.map((t: any) => t.name).join(', ')}`);
    
    await client.disconnect();
    console.log('Disconnected successfully');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// If this file is executed directly, run the test
if (require.main === module) {
  testSimpleClient().catch(console.error);
}
