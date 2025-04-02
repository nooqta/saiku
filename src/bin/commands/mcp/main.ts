// This file is intentionally left empty after refactoring MCP server management.
// MCP servers are now managed externally via the settings file.
// The 'saiku mcp start/stop/status' commands are no longer applicable.

// Export an empty function to satisfy the loader in src/bin/commands/mcp/index.ts
export default async function main() {
    console.log("The built-in 'saiku mcp start/stop/status' commands are deprecated.");
    console.log("MCP servers are now managed externally via the MCP settings file.");
    return "MCP commands deprecated.";
}
