import Agent from '../../../agents/agent';
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';

module.exports = async (program: Command) => {
    const actionCommand = new Command('action')
    .description('Manage actions')
    .option('-m, --llm <model>', 'The language model to use. Possible values: openai,vertexai.', 'openai');


  const actionDir = path.join(__dirname);
  const actionFiles = fs.readdirSync(actionDir);

  // Filter out 'main.js', 'index.js', and any non-.js files
  const commandFiles = actionFiles.filter(file => !['main.js', 'index.js'].includes(file) && path.extname(file) === '.js');

  for (const file of commandFiles) {
    const actionName = path.basename(file, '.js');
    const actionFilePath = path.join(actionDir, file);

    // Import the action module dynamically
    const actionModule = await import(actionFilePath);

    // Assuming each action module exports a default function and an optional configure function
    const actionCmd = new Command(actionName)
      .description(`Perform the ${actionName} action`);

    if (typeof actionModule.configure === 'function') {
      actionModule.configure(actionCmd);
    }

    // Register the action handler
    actionCmd.action(async () => {
      const opts = actionCmd.opts();
      const args = actionCmd.args;
      const agent = new Agent({
        actionsPath: "../actions",
        llm: 'openai',
        allowCodeExecution: true,
      })      
      await actionModule.default(agent, opts, args);
    });

    // Add each subcommand to the actionCommand
    actionCommand.addCommand(actionCmd);
  }

  // Add the 'action' command with all its subcommands to the main program
  program.addCommand(actionCommand);
};
