import main from "./main";

import { Command } from 'commander';


module.exports = (cmd: Command) => {
  cmd
  .command('serve')
    .description('Chat with the Saiku agent in the browser')
    .option('-m, --llm <model>', 'The language model to use. Possible values: openai,vertexai.', 'openai')
    .action(async () => {
      const opts = cmd.opts();
      return await main(opts);
    });
};

