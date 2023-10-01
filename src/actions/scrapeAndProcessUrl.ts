import { Action } from "../interfaces/action";
import puppeteer from "puppeteer";
import OpenAI from "openai";

export default class ScrapeAndProcessURLAction implements Action {
  name = "scrape_and_process_url";
  description =
    "Scrape a URL and process its content based on the provide query. Use only when you need the content visible from the browser.";
  arguments = [
    { name: "url", type: "string", required: true },
    { name: "query", type: "string", required: true },
  ];

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
  // Clean the HTML and generate Emmet-like snippet
  await cleanHTML(page);
  const emmetSnippet = await htmlToEmmet(page);
  await removeNonMarkdownTags(page);

  // Convert remaining HTML to Markdown
  const markdownContent = await convertHtmlToMarkdown(page);

  // Further process with OpenAI
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `
                ${query}
                `,
      },
      {
        role: "user",
        content: `Reference content: \n\n ${markdownContent}`,
      },
    ],
  });

  // Extract and return the processed content
  return response.choices[0]?.message?.content || "";
}

async function htmlToEmmet(page: any) {
  return await page.evaluate(() => {
    function recurse(element: HTMLElement) {
      let snippet = element.tagName.toLowerCase();
      let childrenSnippet = "";
      for (let child of element.children) {
        // @ts-ignore
        childrenSnippet += `+${recurse(child)}`;
      }
      if (childrenSnippet) {
        childrenSnippet = childrenSnippet.substring(1);
      }
      return `${snippet}>${childrenSnippet}`;
    }
    return recurse(document.body);
  });
}

async function removeNonMarkdownTags(page: any) {
  return await page.evaluate(() => {
    document.querySelectorAll("*").forEach((el: any) => {
      if (
        !["H1", "H2", "H3", "A", "P", "UL", "LI", "EM", "STRONG"].includes(
          el.tagName
        )
      ) {
        if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
          el.replaceWith(el.textContent);
        }
      }
    });
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

async function convertHtmlToMarkdown(page: any) {
  return await page.evaluate(() => {
    function recurse(element: HTMLElement) {
      let md = "";
      for (const child of element.childNodes) {
        if (child.nodeType === 3) {
          md += child.nodeValue;
        } else if (child.nodeType === 1) {
          // @ts-ignore
          switch (child.tagName) {
            case "H1":
              md += `# ${child.textContent}\n`;
              break;
            case "H2":
              md += `## ${child.textContent}\n`;
              break;
            case "H3":
              md += `### ${child.textContent}\n`;
              break;
            case "P":
              md += `${child.textContent}\n`;
              break;
            case "LI":
              md += `- ${child.textContent}\n`;
              break;
            default:
              // @ts-ignore
              md += recurse(child);
          }
        }
      }
      return md;
    }
    return recurse(document.body);
  });
}
