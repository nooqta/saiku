#!/bin/bash

# Check if the PID file exists
if [ -f /tmp/saiku-mcp-server.pid ]; then
    PID=$(cat /tmp/saiku-mcp-server.pid)
    
    # Check if the process is running
    if ps -p $PID > /dev/null; then
        echo "Stopping MCP Server with PID $PID"
        kill $PID
        rm /tmp/saiku-mcp-server.pid
        echo "MCP Server stopped"
    else
        echo "MCP Server is not running (PID $PID not found)"
        rm /tmp/saiku-mcp-server.pid
    fi
else
    echo "MCP Server is not running (no PID file found)"
fi