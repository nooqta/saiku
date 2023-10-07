import main from "./main";

import { Command } from 'commander';

module.exports = (cmd: Command) => {
  cmd
  .command('autopilot')
  .name('autopilot')
  .option('-x, --allowCodeExecution', 'Execute the code without prompting the user.')
  .option('-s, --speech <type>', 'Receive voice input from the user and/or output responses as speech. Possible values: input, output, both, none. Default is none', 'none')
    .option('-role, --systemMessage', 'The model system role message')
    .description('AI agent to help automate your tasks on autopilot mode')
    .action(async (_opt: any) => {
      return await main(_opt);
    });
};

