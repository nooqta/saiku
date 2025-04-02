# Migrating from Actions to MCP in Saiku

This guide explains how to migrate from Saiku's legacy action system to the Model Context Protocol (MCP) implementation.

## Why Migrate to MCP?

The Model Context Protocol (MCP) provides several advantages over the legacy action system:

1. **Standardization** - MCP is an emerging standard for LLM applications, ensuring compatibility with other tools
2. **Separation of Concerns** - Clear separation between resources (data) and tools (functionality)
3. **Improved Typing** - Better TypeScript support with schema validation
4. **Structured Context** - More structured way to provide context to LLMs
5. **Modularity** - Easier to extend and maintain

## Action vs MCP Concepts

| Legacy Action | MCP Equivalent | Purpose |
|---------------|----------------|---------|
| Action class | Tool handler | Provides functionality with side effects |
| Action params | Tool schema | Validates parameters |
| getContext() | Resource | Provides data/context to LLMs |
| - | Prompt | Reusable templates for LLM interactions |

## Migration Steps

### 1. Setup MCP

If you haven't already, install the MCP dependencies and set up the basic configuration:

```bash
npx saiku mcp install
```

### 2. Create an MCP Tool Handler

When creating a new functionality, use the MCP approach:

```bash
npx saiku action create
```

When prompted, select "MCP Tool" and follow the prompts.

### 3. Convert Existing Actions to MCP Tools

For each legacy action, create an equivalent MCP tool handler in the `src/mcp/handlers` directory.

**Example: Converting a File Action**

Legacy Action:
```typescript
export default class FileAction implements Action {
    name = 'file_action';
    description = 'Save content to a file or read content from a file';
    parameters = [
        { name: 'operation', type: 'string', required: true, enum: ['read', 'write'] },
        { name: 'filename', type: 'string', required: true },
        { name: 'content', type: 'string', required: false }
    ];
    
    async run(args: { operation: string, filename: string, content?: string }): Promise<string> {
        // Implementation...
    }
}
```

MCP Tool Handler:
```typescript
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import fs from 'fs';
import path from 'path';

export function registerFileOperationTool(server: McpServer): void {
  server.tool(
    "file-operation",
    {
      operation: z.enum(["read", "write", "append", "delete"]).describe("File operation to perform"),
      path: z.string().describe("File path"),
      content: z.string().optional().describe("Content to write (for write/append operations)"),
    },
    async ({ operation, path, content }) => {
      try {
        // Implementation...
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
```

### 4. Register the Tool

Update the `src/mcp/handlers/index.ts` file to register your tool:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerFileOperationTool } from './file-operation';

export function registerAllHandlers(server: McpServer): void {
  registerFileOperationTool(server);
  // Register other tools...
}
```

### 5. Map Legacy Action to MCP Tool

Add a mapping in `src/mcp/utils.ts` to maintain backward compatibility:

```typescript
const actionToToolMapping: Record<string, ToolMapping> = {
  'file_action': {
    tool: 'file-operation',
    transformArgs: (args: any) => ({
      operation: args.operation,
      path: args.filename,
      content: args.content
    })
  },
  // Add more mappings...
};
```

### 6. Using MCP Resources

For providing data to LLMs, create MCP resources instead of getContext() methods:

```typescript
server.resource(
  "config",
  "config://saiku",
  async (uri) => {
    const config = loadSaikuConfig();
    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify(config, null, 2)
      }]
    };
  }
);
```

## Best Practices

1. **Use Zod for Validation** - Take advantage of Zod for parameter validation
2. **Handle Errors Properly** - Return isError: true for error responses
3. **Create Resource Templates** - Use ResourceTemplate for parameterized resources
4. **Modularize Handlers** - Keep each handler in its own file
5. **Document Your API** - Use consistent naming and document your tools/resources

## Testing MCP Tools

You can test your MCP tools using the `saiku mcp` command:

```bash
# Start the MCP server
npx saiku mcp start

# List available MCP capabilities
npx saiku mcp list
```

## Need Help?

If you need assistance migrating your actions to MCP, contact the Saiku team or refer to the [MCP specification](https://github.com/anthropics/anthropic-cookbook/tree/main/model_context_protocol) for more details.