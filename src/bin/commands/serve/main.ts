import Agent from "./../../../agents/agent";
import path from "path";
import { existsSync } from "fs";
import { spawn } from "child_process";

async function main(opts: any) {
  // @todo: allow the user to specify multiple actions paths
  opts = { actionsPath: "../actions", allowCodeExecution: true, ...opts };
  // Initialize the agent
  const agent = new Agent(opts);
  agent.options = opts;
  // Start the socket server
  await agent.functions["chat"].run({});

  // Check if 'node_modules' directory exists
  await checkAndInstallPackages(agent);

  // start the nextjs server

  await agent.functions["execute_code"].run({
    language: "bash",
    code: `cd ${path.join(
      process.cwd(),
      "extensions",
      "ai-chatbot"
    )} && npm run dev`,
  });
}

async function checkAndInstallPackages(agent: Agent) {
  const nodeModulesPath = path.join(
    process.cwd(),
    "extensions",
    "ai-chatbot",
    "node_modules"
  );

  // Check if 'node_modules' directory exists
  if (!existsSync(nodeModulesPath)) {
    console.log("'node_modules' directory not found. Installing packages...");
    try {
      await agent.functions["execute_code"].run({
        language: "bash",
        code: `cd ${path.join(
          process.cwd(),
          "extensions",
          "ai-chatbot"
        )} && pnpm install`,
      });
    } catch (error) {
      console.error("An error occurred during the installation:", error);
    }
  }
}

// Execute the main function
export default main;
