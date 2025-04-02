import { Command } from 'commander';
import path from 'path';
import McpClientManager from '../../../mcp/client'; // Import the manager
import { WorkflowRunner } from '../../../workflows/WorkflowRunner';

export const runCommand = new Command('run')
    .description('Run a specific workflow by name')
    .argument('<name>', 'Name of the workflow to run')
    .action(async (name: string) => {
        // console.log(`Attempting to run workflow: ${name}`); // Removed log
        // Determine settings path (adjust if different)
        const settingsPath = path.resolve(process.cwd(), 'mcp-settings.json');
        const clientManager = new McpClientManager(settingsPath);
        let runner: WorkflowRunner | null = null; // Define runner here for finally block access

        try {
            // Initialize MCP connections
            await clientManager.initializeAndConnectServers();

            // Crucial: Check if any servers connected, as workflows likely depend on them
            if (!clientManager.hasActiveConnections()) {
                console.error("No MCP servers connected. Cannot run workflow.");
                process.exit(1); // Exit if no servers are available
            }

            // Instantiate runner *after* client manager is initialized
            runner = new WorkflowRunner(clientManager);

            // Run the specified workflow
            const finalContext = await runner.runWorkflow(name);
            console.log(`\nWorkflow "${name}" finished successfully.`); // Restore final success log
            // Optionally display final context or summary
            // console.log('\nFinal Execution Context:', JSON.stringify(finalContext, null, 2));

        } catch (error: any) {
            console.error(`\nError running workflow "${name}":`, error.message);
            // Optionally log the full error for debugging
            // console.error(error);
            process.exit(1); // Exit on workflow execution error
        } finally {
            // Ensure MCP client manager disconnects regardless of success/failure
            if (clientManager) {
                await clientManager.disconnectAll();
            }
            // Explicitly exit the process after cleanup (0 for success, 1 for error handled above)
            // Note: process.exit(1) is already called within the catch block for errors.
            process.exit(0);
        }
    });
