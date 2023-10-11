import puppeteer from "puppeteer";
import Agent from "@/agents/agent";
import { Action } from "@/interfaces/action";
import path from "path";

export default class TakeScreenshotAction implements Action {
  agent: Agent;
  name = "take_screenshot";
  description = "Capture a screenshot of a webpage";
  arguments = [
    { name: "url", type: "string", required: true },
    { name: "fullPage", type: "boolean", required: true, default: true },
    {
      name: "resolution",
      type: "object",
      required: true,
      default: { width: 1366, height: 768 },
    },
    {
      name: "filename",
      type: "string",
      required: true,
      default: "screenshot.png",
    },
  ];

  constructor(agent: Agent) {
    this.agent = agent;
  }

  async run(args: {
    url: string;
    fullPage: boolean;
    resolution: { width: number; height: number };
    filename: string;
  }): Promise<any> {
    // Destructure arguments
    const { url, fullPage, resolution, filename } = args;

    // Launch a headless browser using Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    try {
      // Set the viewport to the desired resolution
      await page.setViewport({
        width: resolution?.width || 1366, // Default to 1366x768 if not provided
        height: resolution?.height || 768,
        deviceScaleFactor: 1,
        hasTouch: false,
        isLandscape: false,
        isMobile: false,
      });

      // Navigate to the URL
      await page.goto(url, { waitUntil: "networkidle0" });

      // Path to save the screenshot
      const filePath = path.resolve(process.cwd(), filename);

      // Capture and save the screenshot
      await page.screenshot({
        path: filePath,
        fullPage: fullPage,
      });

      // Close the browser
      await browser.close();

      // Return the filename for further processing or confirmation
      return filePath;
    } catch (error) {
      // Close the browser in case of an error
      await browser.close();
      console.error(error);
      // @ts-ignore
      return `Failed to capture screenshot: ${error.message}`;
    }
  }
}
