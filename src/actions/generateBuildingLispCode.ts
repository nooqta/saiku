import Agent from "@/agents/agent";
import { Action } from "@/interfaces/action";
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
import { AutoLISPGenerator } from "../tools/autolisp-generator";

type BuildingSpecs = {
    base: { width: number, length: number, height: number },
    roof: { type: string, pitch: number },
    door: { width: number, height: number, position: string },
    window: { width: number, height: number, position: string, quantity: number },
    [key: string]: any, // allow any other sections in the text file
    // ... any other sections you have in your text file

};

export default class GenerateBuildingLispCodeAction implements Action {
    agent: Agent;
    name = "generateBuildingLispCode";
    description = "Generate a AutoLisp file of a building based on specifications in a text file";
    arguments = [
        { name: "filePath", type: "string", required: true, description: "Path to the text file containing building specifications." },
    ];

    constructor(agent: Agent) {
        this.agent = agent;
    }

    async run(args: any) {
        try {
        const { filePath } = args;

        // Read and parse the text file
        const fileContent = fs.readFileSync(filePath, "utf8");
        
        const buildingSpecs = this.parseBuildingSpecs(fileContent);
        // Generate AutoLISP code
        const autoLISPCode = this.generateAutoLISP(buildingSpecs);

        // Save the lisp to a file
        await this.agent.functions['save_to_file'].run({ filename: 'drawing.lsp', content: autoLISPCode });
        // Render the AutoLISP code in AutoCAD and capture the image
        // const image = await this.renderAutoCAD(autoLISPCode, imageFile);


        // Save the image
        // const imagePath = this.saveImage(image, imageFile);

        return `File saved at: drawing.lsp`;
    } catch (error: any) {
        console.log(error);
        return JSON.stringify(error);
    }
}

    saveImage(imageBuffer: Buffer, fileName: string): string {
        // Determine the file path
        const filePath = path.join(__dirname, fileName);

        // Write the image buffer to disk
        fs.writeFileSync(filePath, imageBuffer);

        return filePath;
    }
    generateAutoLISP(specs: any) {
        const generator = new AutoLISPGenerator();
        return generator.generateAutoLISP(specs);
    }

    parseBuildingSpecs(fileContent: string): BuildingSpecs {
        const lines = fileContent.split('\n');
        let currentSection: string | null = null;
        const buildingSpecs: Partial<BuildingSpecs> = {};

        lines.forEach(line => {
            line = line.trim();
            if (line.startsWith('-')) {
                const sectionName = line.slice(1).trim().toLowerCase().replace(':', '');
                currentSection = sectionName;
                buildingSpecs[currentSection] = {};
            } else if (currentSection && line.includes(':')) {
                const [key, value] = line.split(':').map(s => s.trim());
                buildingSpecs[currentSection][key.toLowerCase()] = this.parseValue(value);
            } else if (line.includes(':')) {
                const [key, value] = line.split(':').map(s => s.trim());
                buildingSpecs[key.toLowerCase().replace(' ', '_')] = this.parseValue(value);
            }
        });

        if (!buildingSpecs.base || !buildingSpecs.roof || !buildingSpecs.door || !buildingSpecs.window) {
            throw new Error('Missing required sections in building specifications.');
        }

        return buildingSpecs as BuildingSpecs;
    }

    parseValue(value: string): string | number {
        return isNaN(Number(value)) ? value : Number(value);
    }
    async renderAutoCAD(autoLISPCode: string, imageFile: string): Promise<void> {
        // Save the AutoLISP code to a file
        const lispFilePath = path.join(__dirname, 'drawing.lsp');
        fs.writeFileSync(lispFilePath, autoLISPCode);

        // Create a script file to load and execute the AutoLISP code, and export the drawing to an image
        const scriptFilePath = path.join(__dirname, 'commands.scr');
        const scriptContent = `
            (load "${lispFilePath.replace(/\\/g, '\\\\')}")
            (DrawBuilding)
            ._ZOOM _EXTENTS
            ._-EXPORT PNG "${imageFile.replace(/\\/g, '\\\\')}"
        `;
        fs.writeFileSync(scriptFilePath, scriptContent);

        // Execute AutoCAD with the script file
        const autocadExecutable = 'C:\\Program Files\\Autodesk\\AutoCAD 20xx\\acad.exe';
        return new Promise((resolve, reject) => {
            const autocadProcess = spawn(autocadExecutable, ['/b', scriptFilePath]);

            autocadProcess.stdout.on('data', (data: any) => {
                console.log(`stdout: ${data}`);
            });

            autocadProcess.stderr.on('data', (data: any) => {
                console.error(`stderr: ${data}`);
            });

            autocadProcess.on('close', (code: number) => {
                console.log(`AutoCAD process exited with code ${code}`);
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`AutoCAD process exited with code ${code}`));
                }
            });
        });
    }
}


