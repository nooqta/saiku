# Saiku (細工) The AI Agent
<b><a href="https://noqta.mintlify.app/">Read our documentation</a></b>

Looking for the Python version? Check out [Saiku.py](https://github.com/anis-marrouchi/saiku.py).

## Table of Contents

- [About](#about)
  - [Core Architecture: Model Context Protocol (MCP)](#core-architecture-model-context-protocol-mcp)
  - [Why Saiku?](#why-saiku)
  - [What is PEAS?](#what-is-peas)
- [Features](#features)
- [Prerequisites](#prerequisites)
  - [Optional Requirements](#optional-requirements)
- [1. Using Saiku in Your Own Projects](#1-using-saiku-in-your-own-projects)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Importing Saiku](#importing-saiku)
    - [Initializing Saiku Agent](#initializing-saiku-agent)
    - [Configuring Saiku](#configuring-saiku)
    - [Interacting with Saiku](#interacting-with-saiku)
- [2. Using the Project Itself](#2-using-the-project-itself)
  - [Usage](#usage-1)
    - [Clone the Repository](#clone-the-repository)
    - [Navigate to Project Folder](#navigate-to-project-folder)
    - [Install Dependencies](#install-dependencies)
    - [Run the Project Locally](#run-the-project-locally)
- [3. Global Installation (Not Recommended Yet)](#3-global-installation-not-recommended-yet)
- [Demo](#demo)
- [Setting Up Environment Variables](#setting-up-environment-variables)
- [Available Commands](#available-commands)
  - [Examples](#examples)
- [Use Cases (via MCP & Extensions)](#use-cases-via-mcp--extensions)
- [Workflows](#workflows)
- [Future Features](#future-features)
- [Contributing](#contributing)
- [Support Saiku](#support-saiku)
- [Feedback and Issues](#feedback-and-issues)
- [API Rate Limits/Cost](#api-rate-limitscost)
- [Note](#note)
- [License](#license)

## About

This project aims to create a robust, intelligent AI Agent capable of automating various tasks. Our agent is designed following the PEAS (Performance measure, Environment, Actuators, Sensors) framework to ensure it's robust, scalable, and efficient.

### Core Architecture: Model Context Protocol (MCP)

Saiku leverages the **Model Context Protocol (MCP)**, a cutting-edge standard for enabling AI models to interact with external tools and resources securely and efficiently. MCP is becoming increasingly vital in the AI landscape, allowing agents like Saiku to:

*   **Extend Capabilities:** Seamlessly integrate with various tools (filesystem access, web browsing, API interactions, code execution, etc.) provided by connected MCP servers.
*   **Access Real-time Data:** Utilize dynamic information from connected resources (e.g., databases, APIs, system information).
*   **Perform Complex Actions:** Go beyond text generation to execute commands, manipulate files, interact with external systems, and orchestrate multi-step processes.

By building on MCP, Saiku ensures a flexible, extensible, and future-proof architecture for AI agent development. Learn more about MCP [here](./documentation/MCP.md).

### Why Saiku?

"Saiku" (細工) in Japanese refers to detailed or delicate work, symbolizing the intricate and intelligent workings of our AI agent.

- **S**: Smart
- **A**: Artificial
- **I**: Intelligent
- **K**: Knowledgeable
- **U**: Unmatched

We chose a Japanese name to symbolize precision, innovation, and advanced technology, attributes highly respected in Japanese culture. Even though we are based in Tunisia, we believe in global collaboration and the universal appeal and understanding of technology.

### What is PEAS?

PEAS stands for Performance measure, Environment, Actuators, and Sensors. It's a framework used to describe the various components of an intelligent agent:

- **Performance Measure**: How well is the agent doing in its environment? (e.g., task completion rate, efficiency)
- **Environment**: Where the agent operates (e.g., user's local machine, specific software, web)
- **Actuators**: What actions the agent can take via MCP tools (e.g., writing files, executing commands, calling APIs)
- **Sensors**: How the agent perceives its environment via MCP resources and tool outputs (e.g., reading files, getting system status, receiving API responses)

## Features

- **MCP-Powered:** Core architecture based on the Model Context Protocol for secure and extensible tool/resource integration.
- **Multi-LLM Support:** Integrates with various Large Language Models (OpenAI, Vertex AI, Ollama, Hugging Face, Mistral, Anthropic).
- **Workflow Engine:** Define and run complex, multi-step automations using JSON-based workflows.
- **Extensible:** Easily add new capabilities by connecting new MCP servers.
- **VS Code Extension:** Interact with Saiku using voice commands directly within your editor via the [Cline Voice Assistant extension](./extensions/cline-voice-assistant/).
- **Web Interface:** Chat with Saiku through a browser interface.

## Prerequisites

- **Node.js:** Version 18 or higher recommended.
- **LLM API Key:** An API key for at least one supported Large Language Model (e.g., OpenAI).

### Optional Requirements

- **MCP Servers:** For extended capabilities (like file system access, web browsing, code execution, specific API interactions, text-to-speech, speech-to-text), you need to run the corresponding MCP servers. Many servers require their own API keys or setup (e.g., ElevenLabs API key for TTS/STT, Google Cloud credentials for Vision/Calendar). Configure these in your MCP settings.
- **Git:** Required for using git-related MCP tools.

## 1. Using Saiku in Your Own Projects
Saiku can be integrated into your applications to leverage its agent capabilities.

### Installation

- **Step**: Run \`npm install saiku\` in your project directory.

### Usage

#### 1. Importing Saiku

- **Code**:
  \`\`\`javascript
  import Agent from 'saiku';
  // Or specific components if needed
  \`\`\`

#### 2. Initializing Saiku Agent

- **Example**:
  \`\`\`javascript
  async function main(opts) {
    // Ensure MCP client/server setup is handled appropriately
    const agent = new Agent(opts); // Initialize the agent
    // ...
  }
  \`\`\`

#### 3. Configuring Saiku

- **AgentOptions**:
  - **systemMessage** (\`string\` | \`optional\`): Default system message or instructions for the LLM.
  - **allowCodeExecution** (\`boolean\` | \`optional\`): Flag to enable/disable code execution (typically handled by a dedicated MCP server now).
  - **interactive** (\`boolean\` | \`string\` | \`optional\`): Interactive mode setting for CLI usage.
  - **llm** (\`'openai' | 'vertexai' | 'ollama' | 'huggingface' | 'mistral' | 'anthropic'\`): Specifies the language learning model. Default is \`'openai'\`.
  - **[key: string]: any** (\`optional\`): Allows additional custom properties.

- **Example Configuration**:
  \`\`\`javascript
  let opts = {
    systemMessage: "You are Saiku, an AI assistant.",
    interactive: true,
    llm: "openai",
    // Custom options
  };
  \`\`\`

#### 4. Interacting with Saiku

- **Process**:
  - **User Input**: Provide user queries or tasks.
  - **MCP Interaction**: The agent interacts with connected MCP servers to use tools and access resources based on the query.
  - **Response Generation**: Generates responses based on LLM processing and tool results.

- **Example Interaction**:
  \`\`\`javascript
  // Assuming 'agent' is an initialized Agent instance
  async function runInteraction(agent, userQuery) {
    agent.messages.push({ role: "user", content: userQuery });
    await agent.interact(); // Agent processes query, potentially using MCP tools
    // Handle agent's response (last message in agent.messages)
  }
  \`\`\`

## 2. Using the project itself
### Usage
- **Clone the Repository**:
  \`\`\`bash
  git clone https://github.com/nooqta/saiku.git
  \`\`\`

- **Navigate to Project Folder**:
  \`\`\`bash
  cd saiku
  \`\`\`

- **Install Dependencies**:
  \`\`\`bash
  npm install
  \`\`\`


- **Run the Project Locally**:

Before starting Saiku locally, build the project:
\`\`\`bash
npm run build
\`\`\`

To start the agent in interactive CLI mode:
\`\`\`bash
npm start
\`\`\`

For automated building during development:
\`\`\`bash
npm run watch
\`\`\`

## 3. Global Installation (Not Recommended Yet)

Global installation is possible but not recommended due to ongoing development.
\`\`\`bash
npm install -g saiku
\`\`\`

## Demo

https://github.com/nooqta/saiku/assets/3036133/87752826-fc6a-4c16-91a7-917b0f79427a

### A Jupyter notebook available on Google Colab:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/nooqta/saiku/blob/main/saiku-demo-notebook.ipynb) (Note: May require updates for MCP compatibility)

## Setting Up Environment Variables

Configure necessary environment variables for the core agent and any MCP servers you intend to use. Copy the example environment file:
\`\`\`bash
cp .env.example .env
\`\`\`

Edit the \`.env\` file. Minimally, you need an LLM API key:
\`\`\`dotenv
# OpenAI (Example)
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4-turbo # Or another model

# Add other API keys as needed for specific MCP servers
# e.g., ELEVENLABS_API_KEY=... for the ElevenLabs MCP server
# e.g., GOOGLE_APPLICATION_CREDENTIALS=path/to/your/keyfile.json for Google Cloud servers
\`\`\`
Refer to the documentation of individual MCP servers for their specific environment variable requirements.

## Available Commands

Use the Saiku CLI with various options:
\`\`\`
AI agent to help automate your tasks

Options:
  -v, --version                Output the current version.
  -exec, --allowCodeExecution  (Deprecated - Handled by MCP) Execute code without prompting.
  -role, --systemMessage       The model system role message.
  -m, --llm <model>            Specify the language model (openai, vertexai, ollama, huggingface, mistral, anthropic). Default: openai.
  -h, --help                   Display help for command.

Commands:
  mcp [options]                Manage MCP servers.
  workflow [options]           Manage and run workflows.
  autopilot [options]          (Experimental) Run Saiku in autopilot mode.
  serve                        Chat with the Saiku agent in the browser.
  help [command]               Display help for a specific command.
\`\`\`

#### Examples:

To start the interactive CLI with a specific LLM:
\`\`\`bash
npm start -- -m ollama
\`\`\`

To run a specific workflow:
\`\`\`bash
npm start -- workflow run <workflow_name>
\`\`\`

To list connected MCP servers:
\`\`\`bash
npm start -- mcp list
\`\`\`

To chat with Saiku in the browser:
\`\`\`bash
npm start -- serve
\`\`\`

## Use Cases (via MCP & Extensions)

Saiku achieves tasks by leveraging tools provided by connected MCP servers or through specific extensions.

- **Transcribe Audio to Text:** Use an STT MCP server (e.g., ElevenLabs, Whisper) to transcribe audio files.
- **Extract Text from Image:** Use a Vision MCP server (e.g., Google Vision) to perform OCR on images.
- **Summarize Long Articles:** The core LLM can summarize provided text, potentially fetched via a Filesystem or HTTP MCP server.
- **HTML to PDF Conversion:** Use a Puppeteer or similar MCP server with HTML-to-PDF capabilities.
- **Take Screenshot of Webpage:** Use a Puppeteer MCP server.
- **Text to Speech:** Use a TTS MCP server (e.g., ElevenLabs).
- **File Actions (Read/Write/List):** Use a Filesystem MCP server.
- **Database Queries:** Use a custom MCP server connected to your database.
- **Git Operations:** Use a Git MCP server.
- **API Interactions (GitLab, GitHub, etc.):** Use specific MCP servers designed for those APIs.
- **Voice Interaction:** Use the VS Code Cline Voice Assistant extension, which coordinates with STT/TTS MCP servers.

## Workflows

Saiku includes a workflow engine that allows you to define complex, multi-step tasks in a JSON format. These workflows can chain together multiple LLM calls and MCP tool uses to automate sophisticated processes.

- **Define:** Create workflow JSON files (see \`workflows.json\` for examples).
- **List:** \`npm start -- workflow list\`
- **Run:** \`npm start -- workflow run <workflow_name> [input_data]\`

## Future Features

- **Enhanced Workflow Engine**: More complex logic, error handling, and dynamic step generation in workflows.
- **Improved MCP Server Management**: Easier discovery, installation, and configuration of MCP servers.
- **Multi-Agent Collaboration**: Exploring scenarios where multiple Saiku agents (or other MCP-compatible agents) can collaborate.
- **Advanced Memory/Context Management**: More sophisticated techniques for handling long-running tasks and large contexts.
- **Proactive Assistance**: Developing capabilities for the agent to suggest actions or workflows proactively.
- **Refined PEAS Implementation**: Continuously improving how the agent senses its environment and acts within it via MCP.
- **Comprehensive Tests**: Expanding test coverage for core agent logic, MCP interactions, and workflows.
- **Cost Tracking & Budgeting**: Integrating better mechanisms for tracking and managing API costs.

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/YourFeature\`)
3. Commit your changes (\`git commit -m 'Add some feature'\`)
4. Push to the branch (\`git push origin feature/YourFeature\`)
5. Create a new Pull Request

See [Contributing Guidelines](CONTRIBUTING.md).

## Support Saiku

We are actively seeking sponsors and contributors. Your support helps accelerate development.

## Feedback and Issues

Please open an issue on our GitHub repository for feedback or bug reports.

## API Rate Limits/Cost

Be mindful of the rate limits and costs associated with the LLM APIs and any external services used by MCP servers.

## Note

Saiku is under active development. Expect changes to the architecture and features.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
