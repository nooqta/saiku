// Import necessary dependencies
import Agent from "@/agents/agent";
import { Action } from "@/interfaces/action";
import { TextProcessingTool } from "../tools/text-processing";
import { OpenAI } from "openai"; // Adjust the import path accordingly
import dotenv from "dotenv";
dotenv.config();
// Create a new class for text summarization
class TextSummarizer {
  // Wrap the incrementalSummarizeText function in a class method
  async incrementalSummarizeText(options: any): Promise<string> {
    console.log("Incrementally summarizing text...");
    const { text, model = "gpt-3.5-turbo-16k" } = options;
    let { maxTokens = 2000 } = options;

    const textProcessingTool = new TextProcessingTool();
    // Initialize the OpenAI object
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const chunks = await textProcessingTool.run({
      action: "split-text",
      text,
      maxTokens,
      model,
    });

    let initialSummaries = [];
    const totalTokensLimit = 4000;
    let totalTokensUsed = 0;
    const sectionSummaryPrompt = `Summarize the following text while retaining as much of the original content and meaning as possible:`;
    let chunksLeft = chunks.length;

    for (const chunk of chunks) {
      const chunkTokens = await textProcessingTool.run({
        action: "count-tokens",
        text: `${chunk} ${sectionSummaryPrompt}`,
      });

      maxTokens = Math.floor((totalTokensLimit - totalTokensUsed) / chunksLeft);
      totalTokensUsed += maxTokens;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: sectionSummaryPrompt },
          { role: "user", content: chunk },
        ],
        max_tokens: maxTokens,
      });

      initialSummaries.push(
        response.choices[0]?.message?.content?.trim() || ""
      );
      chunksLeft--;
    }

    const combinedSummary = initialSummaries.join("---\n");
    // Do a final summarization of the combined summary
    const finalSummary = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      messages: [
        { 
            role: "system", 
            content: "Summarize the following text while retaining as much of the original content and meaning as possible:"
    },
        { role: "user", content: combinedSummary },
      ],
      max_tokens: 4000,
    });



    return finalSummary.choices[0]?.message?.content?.trim() || "";
  }
}

// Create a new TextSummarizer action class
export default class TextSummarizerAction implements Action {
    dependencies = ["openai","dotenv"];
  agent: Agent;
  name = "text_summarizer";
  description = "Incrementally summarizes text using a specified model";
  arguments = [
    {
      name: "text",
      type: "string",
      required: true,
      description: "The text to summarize",
    },
    {
      name: "model",
      type: "string",
      required: false,
      description:
        "The model to use for summarization (default: gpt-3.5-turbo-16k)",
    },
    {
      name: "maxTokens",
      type: "number",
      required: false,
      description: "Maximum number of tokens per chunk (default: 4000)",
    },
  ];

  summarizer = new TextSummarizer();
  constructor(agent: Agent) {
    this.agent = agent;
  }

  async run(args: {
    text: string;
    model?: string;
    maxTokens?: number;
  }): Promise<string> {
    const summary = await this.summarizer.incrementalSummarizeText(args);
    return summary;
  }
}
