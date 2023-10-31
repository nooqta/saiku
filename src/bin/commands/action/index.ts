import main from "./main";

import { Command } from 'commander';


module.exports = (cmd: Command) => {
  cmd
  .command('action')
  .option('-c, --create <name>', 'Create a new action')
    .description('Chat with the Saiku agent in the browser')
    .action(async (_opt: any) => {
      return await main(_opt);
    });
};

