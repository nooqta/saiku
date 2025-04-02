import { Command } from 'commander';
import { listCommand } from './list';
import { runCommand } from './run';

// Define the command group
const workflowCmd = new Command('workflow')
    .description('Manage and run automated MCP workflows')
    .addCommand(listCommand)
    .addCommand(runCommand);

// Add a default action or help message if just 'saiku workflow' is run
workflowCmd.action(() => {
    workflowCmd.outputHelp();
});

// Export a function using module.exports for CommonJS compatibility
module.exports = function register(program: Command) {
    program.addCommand(workflowCmd);
};
