import * as fs from 'fs';
import * as path from 'path';

const modules: { [key: string]: any } = {};

// Get all folders in the src directory, except the bin folder
const directories = fs.readdirSync(__dirname).filter(dir => {
    return fs.lstatSync(path.join(__dirname, dir)).isDirectory() && dir !== 'bin';
});

// Loop through each directory and import its index.ts content
directories.forEach(dir => {
    const indexFilePath = path.join(__dirname, dir);
    if (fs.existsSync(indexFilePath)) {
        const module = require(indexFilePath);
        modules[dir] = module;
    }
});
// Export all modules
export = modules;