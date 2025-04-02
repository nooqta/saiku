#!/bin/bash

# Stop any existing server first
if [ -f "$(dirname "$0")/stop-server.sh" ]; then
    bash "$(dirname "$0")/stop-server.sh"
fi

# Check if we're running with stdio mode or HTTP mode
if [ "$1" == "--stdio" ]; then
    # Start the MCP server in stdio mode
    node "$(dirname "$0")/../../dist/mcp/server-standalone.js" --stdio > /tmp/saiku-mcp-server.log 2>&1 &
else
    # Start the MCP server in HTTP mode (default)
    node "$(dirname "$0")/../../dist/mcp/server-standalone.js" > /tmp/saiku-mcp-server.log 2>&1 &
fi

# Save the PID
echo $! > /tmp/saiku-mcp-server.pid

echo "MCP Server started with PID $(cat /tmp/saiku-mcp-server.pid)"
echo "Logs at /tmp/saiku-mcp-server.log"