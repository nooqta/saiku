import Agent from "@/agents/agent";
import { Command } from "commander";
import main from "./main";

export { default as main } from "./main";

export const description = "Model Context Protocol server for Saiku";
export const subcommands = ["start", "install", "help"];

module.exports = async (program: Command) => {
  const mcpCommand = new Command("mcp")
    .description(description)
    .argument("[subcommand]", `Subcommand to run: ${subcommands.join(", ")}`)
     .argument("[args...]", "Arguments for the subcommand")
     .action(async (subcommand, args, options) => {
       // Call the main function (which now handles deprecation message)
       // No arguments are needed anymore.
       await main();
     });

   program.addCommand(mcpCommand);
};
