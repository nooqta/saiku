import * as fs from 'fs';
import * as path from 'path';

const modules: { [key: string]: any } = {};

// Read the directory content
const files = fs.readdirSync(__dirname);

// Filter out this file (index.ts) and non-JS files
files.filter(file => file !== 'index.ts' && !file.endsWith('.d.ts') && file.endsWith('.js')).forEach(file => {
    const modulePath = path.join(__dirname, file);
    const exportedModule = require(modulePath);
    Object.keys(exportedModule).forEach(exportedKey => {
        const exportedItem = exportedModule[exportedKey];
        if (typeof exportedItem === 'function' && exportedItem.name) {
            modules[exportedItem.name] = exportedItem;
        }
    });
});

// Export all modules
module.exports = modules;