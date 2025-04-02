# Saiku MCP Documentation

## Overview

Saiku now implements the Model Context Protocol (MCP), a standardized protocol for LLM applications to interact with external data sources and tools. This document explains how MCP is implemented in Saiku and how to use it.

## What is MCP?

The Model Context Protocol (MCP) is a protocol specification that standardizes how LLM applications:

1. Provide context/information to LLMs
2. Execute tools or functions via LLM calls
3. Create reusable prompt templates

MCP separates context provision from LLM interaction, making it easier to create modular, maintainable LLM applications.

## MCP Concepts in Saiku

### Resources

Resources provide read-only data to LLMs. Think of them as GET endpoints in a REST API.

Saiku implements the following default resources:

- `config://saiku` - Access Saiku configuration
- `memory://saiku` - Access agent memory
- `file://{path*}` - Access file content by path
- `dir://{path*}` - List directory contents

**Example usage:**

```typescript
// Read Saiku configuration
const configResponse = await mcpClient.readResource('config://saiku');

// Read a file
const fileResponse = await mcpClient.readResource('file:///path/to/file.txt');

// List directory contents
const dirResponse = await mcpClient.readResource('dir:///path/to/directory');
```

### Tools

Tools provide functionality, often with side effects. Think of them as POST endpoints in a REST API.

Saiku implements the following default tools:

- `execute-code` - Execute code in various languages
- `file-operation` - Read, write, append, or delete files
- `shell-command` - Execute shell commands
- `http-request` - Make HTTP requests

**Example usage:**

```typescript
// Execute Python code
const codeResult = await mcpClient.callTool('execute-code', {
  language: 'python',
  code: 'print("Hello, world!")'
});

// Write to a file
const fileResult = await mcpClient.callTool('file-operation', {
  operation: 'write',
  path: '/path/to/file.txt',
  content: 'Hello, world!'
});
```

### Prompts

Prompts are reusable templates for LLM interactions.

Saiku implements the following default prompts:

- `system-info` - Analyze system information
- `code-review` - Review and suggest improvements for code

**Example usage:**

```typescript
// Get a code review prompt for an LLM
const codeReviewPrompt = await mcpClient.getPrompt('code-review', {
  code: 'function add(a, b) { return a + b; }'
});

// Use the prompt with an LLM
const review = await llm.generateResponse(codeReviewPrompt.messages);
```

## Using MCP in Saiku

### Command Line Interface

Saiku provides CLI commands to work with MCP:

```bash
# Install MCP dependencies and create example configuration
npx saiku mcp install

# Start the MCP server
npx saiku mcp start

# List available MCP capabilities
npx saiku mcp list
```

### Creating MCP Tool Handlers

To create a new MCP tool handler:

1. Run `npx saiku action create`
2. Select "MCP Tool" when prompted
3. The tool will be created in the `src/mcp/handlers` directory

### Using MCP in Code

```typescript
import { getMcpClient, executeWithMcp } from '@/mcp/utils';

// Get the MCP client
const client = getMcpClient();

// Connect to the MCP server
await client.connect();

// Use legacy action names with MCP
const result = await executeWithMcp('http_request', {
  url: 'https://example.com'
});

// Use MCP tools directly
const toolResult = await client.callTool('http-request', {
  url: 'https://example.com',
  method: 'GET'
});

// Read MCP resources
const configResource = await client.readResource('config://saiku');
```

## Extending MCP

### Adding New Resources

Create a new resource in the `src/mcp/server.ts` file:

```typescript
// Simple resource
this.server.resource(
  "my-resource",
  "my-resource://data",
  async (uri) => {
    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify({ data: "example" }, null, 2)
      }]
    };
  }
);

// Parameterized resource
this.server.resource(
  "user",
  new ResourceTemplate("user://{userId}", { list: undefined }),
  async (uri, { userId }) => {
    const userData = await getUserData(userId);
    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify(userData, null, 2)
      }]
    };
  }
);
```

### Adding New Tools

Create a new tool handler in the `src/mcp/handlers` directory:

```typescript
// my-tool.ts
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerMyTool(server: McpServer): void {
  server.tool(
    "my-tool",
    {
      param1: z.string().describe("Description of param1"),
      param2: z.number().optional().describe("Description of param2"),
    },
    async ({ param1, param2 }) => {
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

Then register it in `src/mcp/handlers/index.ts`:

```typescript
import { registerMyTool } from './my-tool';

export function registerAllHandlers(server: McpServer): void {
  // ... other registrations
  registerMyTool(server);
}
```

### Adding New Prompts

Add a new prompt in the `src/mcp/server.ts` file:

```typescript
this.server.prompt(
  "my-prompt",
  { param: z.string() },
  ({ param }) => ({
    messages: [{
      role: "user",
      content: [
        {
          type: "text",
          text: `Here is the parameter: ${param}`
        }
      ]
    }]
  })
);
```

## Best Practices

1. **Use Zod for Validation** - Always use Zod schemas to validate parameters
2. **Handle Errors Properly** - Return `isError: true` for error responses
3. **Follow Naming Conventions** - Use kebab-case for MCP tools and resources
4. **Document API** - Add descriptions to all parameters using `describe()`
5. **Maintain Backward Compatibility** - Register mappings in utils.ts for legacy actions

## Further Reading

- [Model Context Protocol Specification](https://github.com/anthropics/anthropic-cookbook/tree/main/model_context_protocol)
- [Saiku MCP Migration Guide](./migration-to-mcp.md)