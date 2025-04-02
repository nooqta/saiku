/**
 * Standalone MCP server script
 * Used for testing and debugging the MCP server independently
 */

import Agent from "../agents/agent";
import SaikuMcpServer from "./server";

async function main() {
  try {
    console.log("Starting Saiku MCP Server in standalone mode...");
    
    // Create a minimal agent for the server
    const agent = new Agent({
      useMcp: false, // Avoid circular dependency
      llm: "deepseek"
    });
    
    // Create the server
    const server = new SaikuMcpServer(agent);
    
    // Start the server
    await server.start();
    
    // Keep the process running
    console.log("Saiku MCP Server running. Press Ctrl+C to stop.");
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log("\nShutting down...");
      await server.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error("Fatal error starting MCP server:", error);
    process.exit(1);
  }
}

// Run the server
main().catch(error => {
  console.error("Unhandled error:", error);
  process.exit(1);
});