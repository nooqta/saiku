import main from "./main";

import { program } from 'commander';

module.exports = (cmd: typeof program) => {
  cmd
    .option('-exec, --allowCodeExecution', 'Execute the code without prompting the user.')
    .option('-s, --speech <type>', 'Receive voice input from the user and/or output responses as speech. Possible values: input, output, both, none. Default is none', 'none')
    .option('-role, --systemMessage', 'The model system role message')
    .description('AI agent to help automate your tasks')
    .action(async (_opt: any) => {
      return await main(_opt);
    });
};

