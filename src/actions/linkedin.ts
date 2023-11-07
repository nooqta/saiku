import { Action } from "@/interfaces/action";
import Agent from "@/agents/agent";
import fetch from 'node-fetch';  // Ensure you have node-fetch installed in your project.

interface LinkedInPostArgs {
  content: string;
}

export default class LinkedInPostAction implements Action {
    dependencies = ["node-fetch"];
  agent: Agent;
  name = "linkedin_post";
  description = "Post content to LinkedIn";
  parameters =[
    { name: "content", type: "string", required: true, description: "The content to post on LinkedIn." },
  ];

  constructor(agent: Agent) {
    this.agent = agent;
  }

  async run(args: LinkedInPostArgs): Promise<any> {
    const url = 'https://api.linkedin.com/v2/ugcPosts';
    const headers = {
      'Authorization': `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': '202304'
    };

    const data = JSON.stringify({
      author: "urn:li:person:7zPSOY8zay",
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: args.content
          },
          shareMediaCategory: "NONE"
        }
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
      }
    });

    const options = {
      method: "POST",
      headers: headers,
      body: data
    };

    try {
      const response = await fetch(url, options);
      const responseText = await response.text();
      return responseText;
    } catch (error) {
      return JSON.stringify(error);
    }
  }
}
