import puppeteer, { Page } from 'puppeteer';
import fs from 'fs';
import { Action } from '@/interfaces/action';
import Agent from '@/agents/agent';
import { spawn } from 'child_process';


export default class D3Action implements Action {
    static dependencies = ["puppeteer"];
    name = 'd3_chart_generation';
    description = 'Generates various types of charts and saves them as images using D3';
    arguments = [
      {
        name: 'content',
        type: 'string',
        required: true,
        description: 'The complete html, data and  D3 script to generate the chart',
      }
    ];
    agent: Agent;

    constructor(agent: Agent) {
        this.agent = agent;
    }


    async run(args: { content: string}): Promise<string> {
      const browser = await puppeteer.launch();
      const page: Page = await browser.newPage();
  
      // Fetch CSV data

    await page.setContent(args.content);
  
      this.agent.displayMessage(args.content);
  
      await page.waitForTimeout(2000); // Wait for D3 to render
  
      const imageBuffer = await page.screenshot();
      fs.writeFileSync(`chart.png`, imageBuffer);
  
      await browser.close();
  
      return `chart saved as chart.png`;
  }
  
}