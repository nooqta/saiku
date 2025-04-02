/**
 * MCP HTTP Request Tool Handler
 * 
 * This handler provides HTTP request capabilities to the MCP server
 */

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Register the HTTP request tool to an MCP server
 * 
 * @param server The MCP server instance
 */
export function registerHttpRequestTool(server: McpServer): void {
  server.tool(
    "http-request",
    {
      url: z.string().describe("URL to request"),
      method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
        .default("GET")
        .describe("HTTP method"),
      headers: z.record(z.string()).optional()
        .describe("HTTP headers as key-value pairs"),
      body: z.string().optional()
        .describe("Request body (for POST, PUT, etc.)"),
      timeout: z.number().optional()
        .describe("Request timeout in milliseconds")
    },
    async ({ url, method, headers, body, timeout }) => {
      try {
        // Set up request options
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout || 30000);
        
        const options: RequestInit = {
          method,
          headers,
          signal: controller.signal,
          body: method !== "GET" && method !== "HEAD" ? body : undefined
        };
        
        // Make the request
        const response = await fetch(url, options);
        clearTimeout(id);
        
        // Process the response based on content type
        const contentType = response.headers.get("content-type") || "";
        let responseText = "";
        
        if (contentType.includes("application/json")) {
          try {
            const json = await response.json();
            responseText = JSON.stringify(json, null, 2);
          } catch (parseError) {
            responseText = await response.text();
          }
        } else {
          responseText = await response.text();
        }
        
        // Prepare headers for display
        const headerEntries = [...response.headers.entries()];
        const headersText = headerEntries
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n");
        
        return {
          content: [{ 
            type: "text", 
            text: `Status: ${response.status} ${response.statusText}\n\nHeaders:\n${headersText}\n\nBody:\n${responseText}` 
          }]
        };
      } catch (error: any) {
        let errorMessage = error.message;
        
        // Check for specific error types
        if (error.name === 'AbortError') {
          errorMessage = `Request timed out after ${timeout || 30000}ms`;
        } else if (error.code === 'ENOTFOUND') {
          errorMessage = `Could not resolve host: ${url}`;
        }
        
        return {
          content: [{ 
            type: "text", 
            text: `Error: ${errorMessage}` 
          }],
          isError: true
        };
      }
    }
  );
}