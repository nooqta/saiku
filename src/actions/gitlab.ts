import { OpenAI } from 'openai';
import fetch from 'node-fetch';
import Agent from '@/agents/agent';
import { Action } from '@/interfaces/action';
import dotenv from 'dotenv'; 
dotenv.config();

export default class GitLabQueryAction implements Action {
    dependencies = ["openai", "node-fetch", "dotenv"];
    name = "gitlab_query";
    description = "Ask a question about your GitLab projects and get an answer!";
    parameters = [
        { name: "question", type: "string", required: true, description: "Your question related to GitLab projects." }
    ];
    openai: any;
    agent: Agent;

    constructor(agent: Agent) {
        this.agent = agent;
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    async generateGraphQLQuery(question: string): Promise<{ query: string, memory: any }> {
        const response = await this.openai.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: "Generate a GraphQL query or mutation for GitLab based on the user's question: \"" + question + "\".\n" +
                        "Look for parameters like project path, issue ID, and other relevant details in the question. " +
                        "If the question implies a mutation (like creating a note), generate a GraphQL mutation. Otherwise, generate a query.\n" +
                        "Use the following " + (await this.agent.sense()).api_services.gitlab + " when applicable. " +
                        "Use the memory to store any data that might be used in future queries. The key is the equivalent gitlab property and the value is the assigned value.\n" +
                        "JSON Response example for a query:\n" +
                        "{\n" +
                        "    \"query\": \"query {...}\",\n" +
                        "    \"memory\": {\n" +
                        "        \"key\": \"value\"\n" +
                        "    }\n" +
                        "}\n" +
                        "JSON Response example for a mutation:\n" +
                        "{\n" +
                        "    \"query\": \"mutation {...}\",\n" +
                        "    \"memory\": {\n" +
                        "        \"key\": \"value\"\n" +
                        "    }\n" +
                        "}"
                }
            ],
            model: process.env.OPENAI_MODEL || "gpt-4-1106-preview",
            response_format: { type: "json_object" },
        });
        let data = response.choices[0]?.message?.content.trim();

        try {
            data = JSON.parse(data);
            return data;
        } catch (error) {
            return data;
        }
    }

    async queryGitLab(query: string): Promise<string> {
        const endpoint = process.env.GITLAB_GRAPHQL_ENDPOINT || 'https://gitlab.com/api/graphql';
        const token = process.env.GITLAB_PERSONAL_ACCESS_TOKEN || '';

        this.agent.displayMessage(`Querying GitLab with the following GraphQL query:\n${query}`);

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ query })
        });

        return await response.json();
    }

    async run(args: any): Promise<string> {
        const question = args.question;

        try {
            const request = await this.generateGraphQLQuery(question);
            const { query, memory } = request;

            // save any data in the memory to the agent's memory
            if (memory) {
                Object.keys(memory).forEach(key => {
                    this.agent.memory[key] = memory[key];
                });
            }

            const result = await this.queryGitLab(query);

            // Process and return the result as per your needs
            return JSON.stringify(result);
        } catch (error) {
            return `Error occurred: ${JSON.stringify(error)}`;
        }
    }
}
