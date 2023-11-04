import main from "./main";

import { Command, program } from 'commander';

module.exports = (cmd: Command) => {
  cmd
    .option('-exec, --allowCodeExecution', 'Execute the code without prompting the user.')
    .option('-s, --speech <type>', 'Receive voice input from the user and/or output responses as speech. Possible values: input, output, both, none. Default is none', 'none')
    .option('-role, --systemMessage', 'The model system role message')
    .option('-i, --interactive <mode>', 'Run the agent in interactive mode', true)
    .option('-m, --llm <model>', 'The language model to use. Possible values: openai,vertexai. Default is openai', 'openai')
    .description('AI agent to help automate your tasks')
    .action(async (_opt: any) => {
      return await main(_opt);
    });
};

