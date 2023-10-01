import main from "./main";

import { program } from 'commander';

module.exports = (cmd: typeof program) => {
  cmd
    .option('-exec, --allowCodeExecution', 'Execute the code without prompting the user.', false)
    .description('AI agent to help automate your tasks')
    .action(async (_opt: any) => {
      return await main(_opt);
    });
};

