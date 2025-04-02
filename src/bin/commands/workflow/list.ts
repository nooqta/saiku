import { Command } from 'commander';
import path from 'path';
import McpClientManager from '../../../mcp/client'; // Import the manager
import { WorkflowRunner } from '../../../workflows/WorkflowRunner';

export const listCommand = new Command('list')
    .description('List available workflows defined in workflows.json')
    .action(async () => {
        // console.log('Listing available workflows...'); // Removed log
        // Determine settings path (adjust if different)
        const settingsPath = path.resolve(process.cwd(), 'mcp-settings.json');
        const clientManager = new McpClientManager(settingsPath);
        let runner: WorkflowRunner | null = null; // Define runner here for finally block access

        try {
            // Initialize MCP connections
            await clientManager.initializeAndConnectServers();

            // Check if any servers connected (optional, but good practice)
            if (!clientManager.hasActiveConnections()) {
                console.warn("No MCP servers connected. Workflows requiring MCP calls might fail.");
                // Decide if listing should proceed without connections
            }

            // Instantiate runner *after* client manager is initialized
            runner = new WorkflowRunner(clientManager);

            // Load workflows using the runner's method
            await runner.loadWorkflows(); // Loads from default 'workflows.json'

            // Access the loaded workflows via the getter
            const workflows = runner.getWorkflows();

            if (workflows.length === 0) {
                console.log('No workflows found in workflows.json.');
                // No need to exit, just inform the user
            } else {
                console.log('\nAvailable Workflows:');
                workflows.forEach((wf) => { // Type should be inferred from getWorkflows() return type
                    console.log(`- ${wf.name}: ${wf.description ?? 'No description'}`);
                });
                console.log('');
            }

        } catch (error: any) {
            console.error('Error listing workflows:', error.message);
            process.exit(1); // Exit on error during listing/loading
        } finally {
            // Ensure MCP client manager disconnects regardless of success/failure
            if (clientManager) {
                await clientManager.disconnectAll();
            }
            // Explicitly exit the process after cleanup
            process.exit(0);
        }
    });
