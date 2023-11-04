#!/usr/bin/env node
"use strict";

const { Command } = require("commander");
const program = new Command();
const fs = require("fs");
const path = require("path");
const { version } = require(path.resolve(__dirname, "../..", "package.json"));

program.version(version, "-v, --version", "Output the current version");

// Function to get directories
const getDirectories = (source: any) =>
  fs
    .readdirSync(source, { withFileTypes: true })
    .filter((dirent: { isDirectory: () => any; }) => dirent.isDirectory())
    .map((dirent: { name: any; }) => dirent.name);

(async () => {
  // Register default command
  const defaultCmdPath = path.join(__dirname, "commands", "index.js");
  if (fs.existsSync(defaultCmdPath)) {
    const defaultCmd = require(defaultCmdPath);
    defaultCmd(program);
  }

  // Dynamically load commands
  const commandsPath = path.join(__dirname, "commands");
  const commandDirs = getDirectories(commandsPath);

  for (const dir of commandDirs) {
    const indexPath = path.join(commandsPath, dir, "index.js");
    if (fs.existsSync(indexPath)) {
      const commandModule = require(indexPath);
      if (typeof commandModule === "function") {
        await commandModule(program); // Add the command to the main program using the exported function
      } else {
        console.error(`Command loader for '${dir}' does not export a function.`);
      }
    }
  }

  // This should be after all the commands have been loaded
  program.parse(process.argv);
})();

