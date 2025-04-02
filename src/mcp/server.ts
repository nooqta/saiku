/**
 * MCP Server implementation for Saiku
 */

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import Agent from "@/agents/agent";
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { registerAllHandlers } from './handlers';

export class SaikuMcpServer {
  private server: McpServer;
  private agent: Agent;
  private transport: StdioServerTransport | null = null;
  
  constructor(agent: Agent) {
    this.agent = agent;
    
    this.server = new McpServer({
      name: "Saiku",
      version: "1.0.0"
    });
    
    this.initializeResources();
    this.initializeCoreTools();
    this.initializePrompts();
    
    // Register all modular handlers
    registerAllHandlers(this.server);
  }
  
  /**
   * Initialize all resources exposed by the MCP server
   */
  private initializeResources() {
    // Config resource - exposes configuration information
    this.server.resource(
      "config",
      "config://saiku",
      async (uri) => {
        const config = this.loadSaikuConfig();
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify(config, null, 2)
          }]
        };
      }
    );
    
    // Memory resource - access agent memory
    this.server.resource(
      "memory",
      "memory://saiku",
      async (uri) => {
        const memory = this.agent.getMemory();
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify(memory, null, 2)
          }]
        };
      }
    );
    
    // File resource - access files with parameters
    this.server.resource(
      "file",
      new ResourceTemplate("file://{path*}", { list: undefined }),
      async (uri, { path }) => {
        try {
          // Handle path parameter correctly whether it's a string or array
          const filePath = Array.isArray(path) ? path.join('/') : path;
          // Check if path is defined
          if (!filePath) {
            throw new Error('File path is required');
          }
          const content = await fs.promises.readFile(filePath, 'utf-8');
          return {
            contents: [{
              uri: uri.href,
              text: content
            }]
          };
        } catch (error: any) {
          return {
            contents: [{
              uri: uri.href,
              text: `Error reading file: ${error.message}`
            }]
          };
        }
      }
    );
    
    // Directory listing resource
    this.server.resource(
      "directory",
      new ResourceTemplate("dir://{path*}", { list: undefined }),
      async (uri, { path }) => {
        try {
          // Handle path parameter correctly whether it's a string or array
          // Default to current working directory if path is undefined
          let dirPath: any;
          if (path === undefined) {
            dirPath = process.cwd();
          } else {
            dirPath = Array.isArray(path) ? path.join('/') : path;
          }
          
          const files = await fs.promises.readdir(dirPath, { withFileTypes: true });
          
          const listing = files.map(file => ({
            name: file.name,
            isDirectory: file.isDirectory(),
            path: path ? `${dirPath}/${file.name}` : file.name
          }));
          
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify(listing, null, 2)
            }]
          };
        } catch (error: any) {
          return {
            contents: [{
              uri: uri.href,
              text: `Error listing directory: ${error.message}`
            }]
          };
        }
      }
    );
  }
  
  /**
   * Initialize core tools that are built into the server
   */
  private initializeCoreTools() {
    // Code execution tool
    this.server.tool(
      "execute-code",
      {
        language: z.string().describe("Programming language to execute"),
        code: z.string().describe("Code to execute")
      },
      async ({ language, code }) => {
        try {
          const result = await this.executeCode(language, code);
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
    
    // Shell command tool
    this.server.tool(
      "shell-command",
      {
        command: z.string().describe("Shell command to execute")
      },
      async ({ command }) => {
        try {
          const result = await this.executeShellCommand(command);
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
    
    // Note: HTTP request tool is now registered in the modular handlers system
    // instead of here to avoid duplication
  }
  
  /**
   * Initialize all prompts exposed by the MCP server
   */
  private initializePrompts() {
    // System information prompt - Using type assertion to work around SDK type issues
    (this.server as any).prompt(
      "system-info",
      "Get system information analysis",
      (_extra: any) => {
        const info = {
          os: process.platform,
          arch: process.arch,
          nodeVersion: process.version,
          memory: process.memoryUsage(),
          cwd: process.cwd(),
          uptime: process.uptime()
        };
        
        return {
          messages: [{
            role: "user",
            content: [
              {
                type: "text",
                text: `Please provide an analysis of the following system information and suggest optimizations based on the data:\n\n${JSON.stringify(info, null, 2)}`
              }
            ]
          }]
        };
      }
    );
    
    // Code review prompt - Using type assertion to work around SDK type issues
    (this.server as any).prompt(
      "code-review",
      {
        code: z.string().describe("Code to review")
      },
      (args: any) => {
        return {
          messages: [{
            role: "user",
            content: [
              {
                type: "text",
                text: `Please review the following code and suggest improvements for readability, performance, and security:\n\n${args.code}`
              }
            ]
          }]
        };
      }
    );
  }
  
  /**
   * Execute code in the specified language
   */
  private async executeCode(language: string, code: string): Promise<string> {
    let command: string;
    let args: string[];
    
    switch (language.toLowerCase()) {
      case 'python':
        command = 'python3';
        args = ['-c', code];
        break;
      case 'javascript':
      case 'js':
        command = 'node';
        args = ['-e', code];
        break;
      case 'shell':
      case 'bash':
        command = 'sh';
        args = ['-c', code];
        break;
      case 'applescript':
        command = 'osascript';
        args = ['-e', code];
        break;
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
    
    return new Promise((resolve, reject) => {
      const process = spawn(command, args);
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
          resolve(stdout);
        } else {
          reject(new Error(stderr || `Process exited with code ${code}`));
        }
      });
      
      process.on('error', (err) => {
        reject(err);
      });
    });
  }
  
  /**
   * Execute a shell command
   */
  private async executeShellCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const process = spawn('sh', ['-c', command]);
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
          resolve(stdout);
        } else {
          reject(new Error(stderr || `Process exited with code ${code}`));
        }
      });
      
      process.on('error', (err) => {
        reject(err);
      });
    });
  }
  
  /**
   * Load Saiku configuration
   */
  private loadSaikuConfig() {
    const configPath = path.join(process.cwd(), 'saiku.json');
    if (fs.existsSync(configPath)) {
      try {
        const configContent = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(configContent);
      } catch (error) {
        return { error: 'Failed to parse saiku.json' };
      }
    }
    return { warning: 'No saiku.json found' };
  }
  
  /**
   * Start the MCP server
   */
  async start() {
    try {
      this.transport = new StdioServerTransport();
      
      // Add error handling for transport errors
      if (this.transport.onerror) {
        const originalOnError = this.transport.onerror;
        this.transport.onerror = (error) => {
          console.error('MCP Server transport error:', error);
          originalOnError(error);
        };
      } else {
        this.transport.onerror = (error) => {
          console.error('MCP Server transport error:', error);
        };
      }
      
      await this.server.connect(this.transport);
      console.log('Saiku MCP Server started successfully');
    } catch (error) {
      console.error('Error starting MCP server:', error);
      throw error;
    }
  }
  
  /**
   * Stop the MCP server
   */
  async stop() {
    if (this.transport) {
      // Cast needed because TypeScript definitions don't match the actual API
      await (this.transport as any).disconnect();
      this.transport = null;
      console.log('Saiku MCP Server stopped');
    }
  }
  
  /**
   * Get the MCP server instance
   */
  getServer(): McpServer {
    return this.server;
  }
}

export default SaikuMcpServer;
