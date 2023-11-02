import main from "./main";

import { Command } from 'commander';


module.exports = (cmd: Command) => {
  cmd
  .command('action')
  .argument('[action]', 'What action to perform. Available actions: create, list, activate', 'create')
    .description('Manage actions')
    .action(async (action: any) => {
      return await main(action);
    });
};

