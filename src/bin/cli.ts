#!/usr/bin/env node
'use strict';
const { Command } = require('commander');
const program = new Command();
const { readdirSync } = require('fs');
const glob = require('glob'),
  path = require('path');
// get the current version from package.json
const { version } = require(path.resolve(
  process.mainModule?.path,
  '../..',
  'package.json'
).replace(/\\/g, '/'));
program.version(version, '-v, --version', 'Output the current version');

// @todo: move to core
const getDirectories = (source: string) =>
  readdirSync(source, { withFileTypes: true })
    .filter((dirent: any) => dirent.isDirectory())
    .map((dirent: any) => dirent.name);

    // add the default command
const defaultCmd = require(path.resolve(
  process.mainModule?.path,
  'commands/index'
));

defaultCmd(program);

const cmdDir = getDirectories(
  path.join(process.mainModule?.path, 'commands').replace(/\\/g, '/')
).join(',');
glob
  .globSync(
    `${path.join(
      process.mainModule?.path,
    )}/commands/${cmdDir}/index.js`.replace(/\\/g, '/')
  )
  .forEach(function (file: any) {
    const cmd = require(path.resolve(file));
    cmd(program);
    // @todo: register custom commands using glob
  });

program.parse(process.argv);
