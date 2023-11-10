import { Command } from "commander";
import Agent from "../../../agents/agent";

export default async function run(agent: Agent, _opts: any, _args: any) {
  let { name, args } = _opts;
  let opts: any = {};
  _opts.args = _opts.args?.split("|");
  if (Array.isArray(_opts.args)) {
    _opts.args.forEach((opt: string) => {
      // Split the string into two parts: key and the rest
      const [key, ...rest] = opt.split("=");

      // Join the rest back into a string if it was split
      const value = rest.join("=");

      console.log(key, value);
      opts[key] = value;
    });
  }

  // check if the action is exists within the agent functions object
  if (agent.functions[name]) {
    // run the action
    const result = await agent.functions[name].run(opts);
    agent.displayMessage(result);
  } else {
    agent.displayMessage(`The action '${name}' is not recognized.`);
  }
}

export function configure(cmd: Command) {
  cmd
    .option("-n, --name <name>", "The name of the action")
    .option(
      "-a --args <args>",
      "The arguments to pass to the action as key=value pairs separated by pipes (|)"
    );
}
