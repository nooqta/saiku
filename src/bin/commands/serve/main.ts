
import Agent from './../../../agents/agent';
import path from 'path';

async function main(opts: any) {
    // Initialize the agent
    // @todo: allow the user to specify multiple actions paths
    opts = { actionsPath: "../actions", allowCodeExecution: true, ...opts}
    const agent = new Agent(opts);
    agent.options =  opts;
    // Start the socket server
    await agent.functions["chat"].run({});
    // start the nextjs server
    await agent.functions['execute_code']
    .run({
        language: 'bash',
        code: `cd ${path.join(process.cwd(), 'extensions', 'ai-chatbot')} && npm run dev`
    })
  }
  




// Execute the main function
export default main;
