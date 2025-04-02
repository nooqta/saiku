import main from "./main";
// import * as action from "./action"; // Removed import
import * as autopilot from "./autopilot";
import * as serve from "./serve";
import * as mcp from "./mcp";
import * as extension from "./extension"; // Import the new command module

import { Command, program } from 'commander';

module.exports = async (cmd: Command) => {
  cmd
    .argument('[prompt]', 'The prompt to use for the agent')
    .option('-exec, --allowCodeExecution', 'Execute the code without prompting the user.')
    .option('-s, --speech <type>', 'Receive voice input from the user and/or output responses as speech. Possible values: input, output, both, none. Default is none', 'none')
    .option('-role, --systemMessage <role>', 'The model system role message')
    .option('-i, --interactive <mode>', 'Run the agent in interactive mode', true)
    .option('-m, --llm <model>', 'The language model to use. Possible values: deepseek,openai,vertexai. Default is deepseek', 'deepseek')
    .description('AI agent to help automate your tasks')
    .action(async (prompt, _opt: any) => {
      _opt.prompt = prompt;
      return await main(_opt);
    });

  // Register subcommands using module exports if they're functions
  // or createCommand if they export properties
  const autopilotLoader = require('./autopilot');
  const serveLoader = require('./serve');
  const mcpLoader = require('./mcp'); 
  const extensionLoader = require('./extension'); // Load the new module

  // --- Register Autopilot ---
  if (typeof autopilotLoader === 'function') await autopilotLoader(cmd);
  else cmd.addCommand(createCommand('autopilot', autopilot)); // Pass module object

  // --- Register Serve ---
  if (typeof serveLoader === 'function') await serveLoader(cmd);
  else cmd.addCommand(createCommand('serve', serve)); // Pass module object

  // --- Register MCP (Special Handling) ---
  // We directly add the command here, avoiding the generic createCommand
  // This ensures the deprecated main function is called correctly.
  const mcpCmd = new Command('mcp')
      .description("Manage MCP server (Deprecated - managed via settings file)")
      .action(async () => {
          // Directly call the simplified main function from mcp/main.ts
          // Assuming mcpLoader is the module object containing the main function
          if (mcpLoader && typeof mcpLoader.main === 'function') {
              await mcpLoader.main();
          } else {
              console.error("Could not find main function for mcp command.");
          }
      });
  // Add subcommands like 'list' if they still exist in mcpLoader,
  // but they should likely be deprecated too.
  // Example: if (mcpLoader.list) mcpCmd.addCommand(createCommand('list', mcpLoader.list)); // We might add subcommands back here if needed
  cmd.addCommand(mcpCmd);

  cmd.addCommand(mcpCmd);

  // --- Register Extension Command ---
  // Use the default export structure assumed in extension.ts
  if (extensionLoader.default) {
      cmd.addCommand(createCommand('extension', extensionLoader.default));
  } else {
       console.error("Could not load extension command module correctly.");
  }

}; // End of module.exports = async (cmd: Command) => { ... }

// Original createCommand function (kept for other subcommands like autopilot, serve, extension)
function createCommand(name: string, moduleDefinition: any) { // Rename 'module' to avoid conflict
  const subCmd = new Command(name);
  subCmd.description(moduleDefinition.description || `${name} commands`);

  // Check if the module definition itself is the main function (like extension.ts)
  if (typeof moduleDefinition.main === 'function' && !moduleDefinition.subcommands) {
       subCmd.action(async (options) => {
           // Directly call the main function from the module definition
           await moduleDefinition.main(options); // Pass options if needed
       });
  }
  // Keep original logic for modules structured differently (like autopilot/serve potentially)
  else if (moduleDefinition.subcommands) {
    subCmd.argument('[subcommand]', `Subcommand to run: ${moduleDefinition.subcommands.join(', ')}`) // Fix: Use moduleDefinition here
      .argument('[args...]', 'Arguments for the subcommand')
      .action(async (subcommand, args, options) => {
        // This logic might need refinement based on how autopilot/serve actually work
        await moduleDefinition.main(null, [subcommand, ...args], options);
      });
  } else if (typeof moduleDefinition.main === 'function') {
      // This case might be redundant now due to the check above, but kept for safety
      subCmd.action(async (options) => {
          await moduleDefinition.main(null, [], options);
      });
  }


  return subCmd;
}
