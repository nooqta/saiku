import main from "./main";

import { Command } from 'commander';


module.exports = (cmd: Command) => {
  cmd
  .command('action')
  .option('-m, --llm <model>', 'The language model to use. Possible values: openai,vertexai. Default is openai', 'socket')
  .argument('[action]', 'What action to perform. Available actions: create, list, activate', 'create')
    .description('Manage actions')
    .action(async (action: any, opts) => {
      return await main({action, opts});
    });
};

