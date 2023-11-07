import { Action } from "../interfaces/action";
import Agent from "@/agents/agent";
import fs from "fs";
import puppeteer from "puppeteer";
import fetch from "node-fetch";
import axios from 'axios';

export default class MoleculeStructureAction implements Action {
    dependencies = ["puppeteer","node-fetch","axios"];
  agent: Agent;
  name = "molecule_structure";
  description = "Generates an image of a molecule structure using PubChem";

  parameters =[
    {
      name: "input",
      type: "string",
      required: true,
      description: "The SMILES notation of the chemical structure",
    },
    {
      name: "output",
      type: "string",
      required: true,
      description: "Path to save the generated image",
    },
  ];

  constructor(agent: Agent) {
    this.agent = agent;
  }


async run(args: { input: string; format: string; output: string; retrieveData?: boolean }): Promise<any> {
    try {
        let apiUrl: string;
        const { input, format = 'smiles', output, retrieveData } = args;
        switch(format) {
            case 'smiles':
            case 'smi':
                apiUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(args.input)}/PNG`;
                break;
            case 'inchi':
                apiUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/inchi/${encodeURIComponent(args.input)}/PNG`;
                break;
            case 'cas':
                apiUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(args.input)}/PNG`;
                break;
            case 'name':
                apiUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(args.input)}/PNG`;
                break;
            default:
                throw new Error("Invalid format specified");
        }

        const browser = await puppeteer.launch({
            headless: 'new',
        });
        const page = await browser.newPage();
        await page.goto(apiUrl); // navigate directly to the image URL
        await page.screenshot({ path: args.output });
        await browser.close();
        console.log(`Molecule image generated and saved to ${args.output}`);
        let additionalData = null;
        if (args.retrieveData) {
            const propertiesURL = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${args.input}/property/MolecularFormula,MolecularWeight,CanonicalSMILES/JSON`;
            const classificationURL = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${args.input}/classification/JSON`;

            const propertiesResponse = await axios.get(propertiesURL);
            const classificationResponse = await axios.get(classificationURL);

            additionalData = {
                properties: propertiesResponse.data.PropertyTable.Properties[0],
                classification: classificationResponse.data.InformationList.Information[0]
            };
        }

        return JSON.stringify({
            message: `Molecule image generated and saved to ${args.output}`,
            additionalData: additionalData
        });

    } catch (err) {
        console.error(err);
        throw new Error("Failed to generate molecule image and/or retrieve data.");
    }
}

}
