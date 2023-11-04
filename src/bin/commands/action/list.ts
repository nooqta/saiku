import fs from "fs";
import path from "path";
import Agent from "../../../agents/agent";
import Table from "cli-table";

export default async function list(agent: Agent) {
    const filePath = path.resolve(process.cwd(), "saiku.json");
    const functions = agent.getAllFunctions();
    if (!fs.existsSync(filePath)) {
      // create the file
      fs.writeFileSync(
        filePath,
        JSON.stringify({ actions: [] }, null, 2),
        "utf8"
      );
    }
    const config = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const activeActions: any = functions
      .filter(async (action) => isActivated(action.name, config))
      .map((action: any) => [
        action.name,
        action.description,
        action.dependencies?.join("\n") || "",
      ])
      .sort((a: any, b: any) => a[0].localeCompare(b[0]));
  
    const table = new Table({
      head: ["Name", "Description", "Dependencies"],
      colWidths: [30, 50, 30],
      style: {
        "padding-left": 1,
        "padding-right": 1,
        head: ["yellow"],
      },
    });
    table.push(...activeActions);
    console.log(table.toString());
  }

  function isActivated(action: string, config: any): boolean {
    try {
      if (config.actions && config.actions.includes(action)) {
        return true; // The action is activated
      }
  
      return false; // The action is not activated
    } catch (error) {
      // Handle file read or JSON parse errors here
      console.error(`Error reading saiku.json: ${error}`);
      return false; // Assume the action is not activated on error
    }
  }