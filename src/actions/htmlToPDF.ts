import Agent from "@/agents/agent";
import { Action } from "@/interfaces/action";
import puppeteer from "puppeteer";

export default class HTMLToPDFAction implements Action {
    agent: Agent;
    name = "htmlToPDF";
    description = "Create a PDF from HTML content";
    arguments = [
        { name: "htmlContent", type: "string", required: true, description: "The HTML content to convert to PDF." },
        { name: "outputPath", type: "string", required: true, description: "The path where the PDF should be saved." }
    ];

    constructor(agent: Agent) {
        this.agent = agent;
    }

    async run(args: any): Promise<string> {
        const { htmlContent, outputPath } = args;

        // Launch a new browser instance
        const browser = await puppeteer.launch();

        // Open a new page
        const page = await browser.newPage();

        // Set the content of the page to the provided HTML content
        await page.setContent(htmlContent);

        // Convert the page to PDF
        await page.pdf({ path: outputPath, format: 'A4' });

        // Close the browser
        await browser.close();

        return `PDF has been saved to ${outputPath}.`;
    }
}
