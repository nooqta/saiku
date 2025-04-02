import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import util from 'util';
// @ts-ignore Cannot find module 'esm-ts' or its corresponding type declarations.
import { requiresm } from 'esm-ts'; 

const execPromise = util.promisify(exec);

const VOICE_ASSISTANT_PATH = path.resolve(__dirname, '..', '..', '..', 'extensions', 'cline-voice-assistant');

async function checkAndSetupVoiceAssistant() {
    // @ts-ignore Cannot find name 'ora'.
    const { oraPromise } = await requiresm('ora');
    
    console.log(`Checking for Cline Voice Assistant at: ${VOICE_ASSISTANT_PATH}`);

    if (!fs.existsSync(VOICE_ASSISTANT_PATH)) {
        console.error('Error: Cline Voice Assistant extension directory not found.');
        console.log('Please ensure it has been created in the extensions/ directory.');
        return;
    }

    console.log('Voice Assistant directory found.');

    const nodeModulesPath = path.join(VOICE_ASSISTANT_PATH, 'node_modules');
    const packageLockPath = path.join(VOICE_ASSISTANT_PATH, 'package-lock.json');

    if (!fs.existsSync(nodeModulesPath) || !fs.existsSync(packageLockPath)) {
        console.log('Dependencies not installed. Running npm install...');
        try {
            await oraPromise(
                execPromise(`npm install --prefix ${VOICE_ASSISTANT_PATH}`), 
                'Installing dependencies...'
            );
            console.log('Dependencies installed successfully.');
        } catch (error: any) {
            console.error(`Error installing dependencies: ${error.message}`);
            return;
        }
    } else {
        console.log('Dependencies seem to be installed.');
    }

    const outDir = path.join(VOICE_ASSISTANT_PATH, 'out');
    if (!fs.existsSync(outDir)) {
         console.log('Extension not compiled. Running npm run compile...');
         try {
            await oraPromise(
                execPromise(`npm run compile --prefix ${VOICE_ASSISTANT_PATH}`),
                'Compiling extension...'
            );
             console.log('Extension compiled successfully.');
         } catch (error: any) {
             console.error(`Error compiling extension: ${error.message}`);
             return;
         }
    } else {
        console.log('Extension seems to be compiled.');
    }

    console.log('\nCline Voice Assistant setup checked.');
    console.log('Note: This command checks/installs/compiles the extension files.');
    console.log('Activation within VS Code depends on its activation events (e.g., running its command).');
    console.log('You may need to reload VS Code for it to recognize the compiled extension.');

}

// We'll export this function to be used by the command registration
export default {
    description: 'Checks and prepares the Cline Voice Assistant VS Code extension.',
    main: checkAndSetupVoiceAssistant // The function to run
    // No subcommands needed for this simple check
};
