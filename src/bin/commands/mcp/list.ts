// This file is intentionally modified after refactoring MCP server management.
// The 'saiku mcp list' command is no longer applicable as servers are managed externally.

export default async function list() {
    console.log("The 'saiku mcp list' command is deprecated.");
    console.log("MCP servers and their tools/resources are managed externally via the MCP settings file.");
    return "MCP list command deprecated.";
}
