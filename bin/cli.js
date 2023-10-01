#!/usr/bin/env node
require('module-alias/register');
const main = require('../dist/main.js').default; // Adjust the path according to your project structure

async function cli() {
    try {
        await main();
    } catch (error) {
        console.error(`An error occurred: ${error}`);
    }
}

cli();