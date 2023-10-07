import { Action } from "../interfaces/action";
import puppeteer from "puppeteer";
import OpenAI from "openai";
import Agent from "@/agents/agent";

export default class ScrapeAndProcessURLAction implements Action {
  agent: Agent;
  name = "scrape_and_process_url";
  description =
    "Scrape a URL and process its content based on the provided query. Use only when you need the content visible from the browser.";
  arguments = [
    { name: "url", type: "string", required: true },
    { name: "query", type: "string", required: true },
  ];
// Constructor
constructor(agent: Agent) {
  this.agent = agent;
}
  async run(args: { url: string; query: string }): Promise<any> {
    try {
      const { url, query } = args;

      // Validate arguments
      if (!url) {
        return "URL is required";
      }

      // Initialize OpenAI API
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Launch browser and open a new page
      const browser = await puppeteer.launch({
        headless: false,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();

      // Navigate to the URL
      await page.goto(url, { waitUntil: "networkidle0" });

      // Process the content with the provided logic
      const processedContent = await processContent(openai, page, query);

      // Close the browser
      await browser.close();
      // Return the processed content
      return processedContent;
    } catch (error) {
      return JSON.stringify(error);
    }
  }
}

async function processContent(
  openai: OpenAI,
  page: any,
  query = "What is the main content of this page?"
) {
  // Clean the HTML
  await cleanHTML(page);

  // Extract the page's content
  const pageContent = await getPageContent(page);

  // Process with OpenAI
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: query,
      },
      {
        role: "user",
        content: `Reference content: \n\n ${pageContent}`,
      },
    ],
  });

  // Extract and return the processed content
  return response.choices[0]?.message?.content || "";
}

async function getPageContent(page: any) {
  return await page.evaluate(() => {
    return document.body.innerText;
  });
}

async function cleanHTML(page: any) {
  await page.evaluate(() => {
    const tagsToRemove = [
      "style",
      "script",
      "iframe",
      "noscript",
      "img",
      "svg",
    ];
    tagsToRemove.forEach((tag) => {
      const elements = document.querySelectorAll(tag);
      elements.forEach((el) => el.remove());
    });
    // @ts-ignore
    const walk = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      // @ts-ignore
      false
    );
    let node;
    while ((node = walk.nextNode())) {
      if (node.nodeValue !== null) {
        node.nodeValue = node.nodeValue.replace(/[ \t]+/g, " ");
      }
    }
  });
}

