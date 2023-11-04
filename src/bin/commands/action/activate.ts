import OpenAI from "openai";
import { prompt } from "prompts";
import fs from "fs";
import path from "path";
import { Action } from "@/interfaces/action";
import Agent from "../../../agents/agent";
import { spawn } from "child_process";

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
  
  export default async function activate(agent: Agent) {
    const saikuFilePath = path.resolve(process.cwd(), "saiku.json");
    const actions = agent.getAllFunctions(); // Assuming actions are in the same directory
  
    // Get the list of actions that are not activated
    const unactivatedActions = actions.filter(
      (action: Action) => !isActionActivated(action.name, saikuFilePath)
    );
  
    if (unactivatedActions.length === 0) {
      agent.displayMessage("No actions to activate.");
      return;
    }
  
    // Prompt the user to select an action to activate
    const choices = unactivatedActions.map((action, index) => ({
      title: action.name,
      description: action.description,
      value: index,
    }));
  
    const { selectedActionIndex } = await prompt({
      type: "select",
      name: "selectedActionIndex",
      message: "Select an action to activate:",
      choices,
    });
  
    if (selectedActionIndex !== undefined) {
      const selectedAction = unactivatedActions[selectedActionIndex];
      const dependencies = selectedAction.dependencies;
      // Install dependencies (You need to define a function for this)
      await installActionDependencies(dependencies || [], selectedAction.name);
  
      // Add the action to saiku.json
      addToSaiku(saikuFilePath, selectedAction.name);
  
      console.log(`Action "${selectedAction.name}" has been activated.`);
    } else {
      console.log("No action selected for activation.");
    }
  }
  
  function addToSaiku(saikuFilePath: string, actionName: string) {
    try {
      const saikuData = JSON.parse(fs.readFileSync(saikuFilePath, "utf8"));
  
      if (!saikuData.actions) {
        saikuData.actions = [];
      }
  
      saikuData.actions.push(actionName);
  
      fs.writeFileSync(saikuFilePath, JSON.stringify(saikuData, null, 2), "utf8");
    } catch (error) {
      console.error(`Error reading/writing saiku.json: ${error}`);
    }
  }
  
  function isActionActivated(action: string, saikuFilePath: string) {
    try {
      const saikuData = JSON.parse(fs.readFileSync(saikuFilePath, "utf8"));
  
      return saikuData.actions && saikuData.actions.includes(action);
    } catch (error) {
      console.error(`Error reading saiku.json: ${error}`);
      return false;
    }
  }
  
  async function installActionDependencies(
    dependencies: string[],
    action: string
  ) {
    return new Promise((resolve, reject) => {
      console.log(`Installing dependencies for "${action}"...`);
  
      const npmInstall = spawn("npm", ["install", ...dependencies], {stdio: "inherit"});
  
      npmInstall.on("close", (code: any) => {
        if (code === 0) {
          console.log(`Dependencies for "${action}" installed successfully.`);
          resolve(true);
        } else {
          console.error(`Failed to install dependencies for "${action}".`);
          reject(new Error(`npm install failed with exit code ${code}`));
        }
      });
  
      npmInstall.on("error", (err: any) => {
        console.error(
          `Error while installing dependencies for "${action}": ${err.message}`
        );
        reject(err);
      });
    });
  }