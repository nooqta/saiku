# Saiku (細工) The AI Agent
<b><a href="https://noqta.mintlify.app/">Read our documentation</a></b>
## Table of Contents

- [About](#about)
  - [Why Saiku?](#why-saiku)
  - [What is PEAS?](#what-is-peas)
- [Features](#features)
- [Prerequisites](#prerequisites)
  - [Optional requirements](#optional-requirements)
    - [Google Vision](#google-vision)
    - [Google Calendar, Docs and Sheets](#google-calendar-docs-and-sheets)
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
- [Use Cases](#use-cases)
  - [Use Case 1: Transcribe Audio to Text](#use-case-1-transcribe-audio-to-text)
  - [Use Case 2: Extract Text from an Image](#use-case-2-extract-text-from-an-image)
  - [Use Case 3: Summarize a Long Article](#use-case-3-summarize-a-long-article)
  - [Use Case 4: HTML to PDF Conversion](#use-case-4-html-to-pdf-conversion)
  - [Use Case 5: Take a Screenshot of a Webpage](#use-case-5-take-a-screenshot-of-a-webpage)
  - [Use Case 6: Text to Speech](#use-case-6-text-to-speech)
  - [Use Case 7: Create a Simple Chart](#use-case-7-create-a-simple-chart)
  - [Use Case 8: Parse PDF Content](#use-case-8-parse-pdf-content)
  - [Use Case 9: Perform a Database Query](#use-case-9-perform-a-database-query)
  - [Use Case 10: File Actions (Read/Write)](#use-case-10-file-actions-readwrite)
- [Future Features](#future-features)
- [Contributing](#contributing)
- [Support Saiku](#support-saiku)
- [Feedback and Issues](#feedback-and-issues)
- [API Rate Limits/Cost](#api-rate-limitscost)
- [Note](#note)
- [License](#license)

## About

This project aims to create a robust, intelligent AI Agent capable of automating various tasks. Our agent is designed following the PEAS (Performance measure, Environment, Actuators, Sensors) framework to ensure it's robust, scalable, and efficient.

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

- **Performance Measure**: How well is the agent doing in its environment
- **Environment**: Where the agent operates
- **Actuators**: What actions the agent can take
- **Sensors**: How the agent perceives its environment

## Features

- Modular Design
- OpenAI GPT-4 Integration
- Extensible and Customizable

## Prerequisites

- Node.js installed
- OpenAI API key

### Optional requirements
#### Google Vision
- Google Cloud SDK installed and configured with a project:
  - Install [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
  - Authenticate with Google Cloud: 
    ```bash
    gcloud auth login
    ```
  - Set your project ID:
    ```bash
    gcloud config set project <your-project-id>
    ```
- Enable the Google Vision API for your project:
  - Visit the [Google Cloud Console](https://console.cloud.google.com/)
  - Navigate to the 'APIs & Services > Dashboard' 
  - Click on '+ ENABLE APIS AND SERVICES', search for 'Vision API' and enable it.
#### Google Calendar, docs and sheets
 - Download the service account JSON file from your GCP project page


## 1. Using Saiku in Your Own Projects
Saiku is a versatile tool that enhances projects with advanced functionalities. This guide will help you integrate Saiku into your applications, covering the installation, configuration, and usage.

### Installation

- **Step**: Run `npm install saiku` in your project directory to add Saiku as a dependency.

### Usage

#### 1. Importing Saiku

- **Code**: 
  ```javascript
  import Agent from 'saiku';
  ```

#### 2. Initializing Saiku Agent

- **Example**: 
  ```javascript
  async function main(opts) {
    const agent = new Agent(opts); // Initialize the agent
    // Additional initialization code
  }
  ```

#### 3. Configuring Saiku

- **AgentOptions**:
  - **actionsPath** (`string` | `optional`): Path to custom action scripts.
  - **systemMessage** (`string` | `optional`): Default system message or instructions.
  - **allowCodeExecution** (`boolean` | `optional`): Flag to enable/disable code execution.
  - **interactive** (`boolean` | `string` | `optional`): Interactive mode setting.
  - **speech** (`'input' | 'output' | 'both' | 'none'`): Configures speech functionality.
  - **llm** (`'openai' | 'vertexai' | 'ollama' | 'huggingface'`): Specifies the language learning model. Default is `'openai'`.
  - **[key: string]: any** (`optional`): Allows additional custom properties for unique project requirements.

- **Example Configuration**:
  ```javascript
  let opts = {
    actionsPath: "../actions",
    systemMessage: "Welcome to Saiku",
    allowCodeExecution: true,
    interactive: true,
    speech: "both",
    llm: "openai",
    // Custom options
  };
  ```

#### 4. Interacting with Saiku

- **Process**:
  - **Listening for User Input**: Implement input mechanisms for user interaction.
  - **Processing Queries**: The agent processes and performs actions based on queries.
  - **Generating Responses**: Generates responses or results from actions.
  - **Speaking Output**: For speech-enabled applications, configure spoken output.

- **Example Interaction**:
  ```javascript
  do {
    let userQuery = await getUserInput(); // Get user input
    agent.messages.push({ role: "user", content: userQuery });

    await agent.interact(); // Process and perform actions
    
    // Additional code
  } while (userQuery.toLowerCase() !== "quit");
  ```

## 2. Using the project itself
### Usage
- **Clone the Repository**:
  ```bash
  git clone https://github.com/nooqta/saiku.git
  ```

- **Navigate to Project Folder**:
  ```bash
  cd saiku
  ```

- **Install Dependencies**:
  ```bash
  npm install
  ```


- **Run the Project Locally**:

Before starting Saiku locally, build the project using the following command:

```
npm run build
```

To start the agent:

```
npm start
```

For automated building during development, use:

```
npm run watch
```

This will automatically build the project whenever files are changed, helping streamline the development process.
## 3. Global Installation (Not Recommended Yet)

Saiku is available globally but is still in early development. Local installation is recommended.

```bash
npm install -g saiku
```

### Documentation and API

For detailed documentation and API usage, refer to the upcoming Saiku documentation, which will provide comprehensive guidance for advanced uses.

---

This guide is designed to provide clarity and ease of use for integrating Saiku into various projects, catering to a wide range of developers.

Although Saiku is available as an npm package, we are still in the early stages of development, and drastic changes to the architecture will occur. We don't recommend installing it globally yet. However, if you still wish to do so:

```
npm install -g saiku
```
## Demo

https://github.com/nooqta/saiku/assets/3036133/87752826-fc6a-4c16-91a7-917b0f79427a

### A Jupyter notebook available on Google Colab:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/nooqta/saiku/blob/main/saiku-demo-notebook.ipynb)

### Setting Up Environment Variables

Before running Saiku, configure the necessary environment variables. Copy the example environment file and then fill in the details.

```
cp .env.example .env
```

Edit the `.env` file to include your specific information:

```
# OpenAI
OPENAI_API_KEY=
OPENAI_MODEL=gpt-3.5-turbo
# Eleven Labs
ELEVENLABS_API_KEY=
# Database related
DB_HOST=
DB_USER=
DB_PASSWORD=
# Email related
EMAIL_SERVICE=
EMAIL_USER=
DISPLAY_FROM_EMAIL=
EMAIL_PASS=
# User related
USER=
COMPANY=
COUNTRY=
CITY=
PHONE=
LATITUDE=
LONGITUDE=
# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
# Weather API
WEATHER_API_KEY=
# Stability AI
STABILITY_API_KEY=
# GITLAB
GITLAB_GRAPHQL_ENDPOINT=
GITLAB_PERSONAL_ACCESS_TOKEN=
GITLAB_USERNAME=
GITLAB_VERSION=
GITLAB_API_VERSION=
```

### Available Commands

Use Saiku with various options to tailor its operation to your needs:

```
AI agent to help automate your tasks

Options:
  -v, --version                Output the current version.
  -exec, --allowCodeExecution  Execute the code without prompting the user.
  -s, --speech <type>          Receive voice input from the user and/or output responses as speech.
                               Possible values: input, output, both, none. Default is "none".
  -role, --systemMessage       The model system role message.
  -m, --llm <model>            Specify the language model to use. 
                               Possible values: openai, vertexai, ollama, and huggingface. Default is "openai".
  -h, --help                   Display help for command.

Commands:
  action [options]             Manage actions: create an new action using AI, list available actions and activate an action.
  autopilot [options]          AI agent to help automate your tasks on autopilot mode (in progress).
  serve                        Chat with the Saiku agent in the browser.
```

#### Examples:

To allow code execution without prompting:

```
saiku -exec
```
or
```
npm start -- -exec
```

To enable voice input and output:
```
saiku -s both
```
or
```
npm start -- --speech both
```

To specify a language model:
```
saiku -m huggingface
```
or
```
npm start -- --llm huggingface
```

To chat with Saiku in the browser
```
saiku serve
# or
npm start -- serve
```

To create a new action
```
saiku action create
# or
npm start -- action create
```

## Use Cases

### Use Case 1: Transcribe Audio to Text

Prompt Example: "Please transcribe the audio from interview.mp3."
Description: Saiku will use the speech_to_text function to transcribe the audio file interview.mp3 and provide the user with the text content.

### Use Case 2: Extract Text from an Image

Prompt Example: "Extract text from this photo image_of_document.jpg."
Description: Saiku will use google_vision with the DOCUMENT_TEXT_DETECTION feature to analyze the image image_of_document.jpg and return any readable text found in the image.

### Use Case 3: Summarize a Long Article

Prompt Example: "Summarize the following article content for me: ...(article text)..."
Description: Saiku utilizes the text_summarizer function to produce a concise summary of the provided article text.

### Use Case 4: HTML to PDF Conversion

Prompt Example: "Convert this HTML code to a PDF file and save it as report.pdf."
Description: Saiku employs the html_to_pdf tool to transform the given HTML code into a PDF document and saves it with the filename report.pdf.

### Use Case 5: Take a Screenshot of a Webpage

Prompt Example: "Take a full-page screenshot of the website at http://example.com and name the file screenshot.png."
Description: Saiku uses the take_screenshot feature, set to capture the full page, to create an image file screenshot.png of the URL provided.

### Use Case 6: Text to Speech

Prompt Example: "Please convert the following text to speech: Hello World!."
Description: Saiku runs the text_to_speech function to convert the text "Hello World!" into an audio file and will play it if the user requests.

### Use Case 7: Create a Simple Chart

Prompt Example: "Make a pie chart with this data: { 'Data A': 30, 'Data B': 70 }."
Description: Using the d3_chart_generation, Saiku will generate a pie chart image based on the data provided.

### Use Case 8: Parse PDF Content

Prompt Example: "Extract the text from the PDF file named report.pdf."
Description: Saiku will apply the parse_pdf function to read the PDF file report.pdf and extract its text content.

### Use Case 9: Perform a Database Query

Prompt Example: "Perform a SQL query SELECT * FROM users on the local userDB database."
Description: Saiku executes the database_query action, running the provided SQL query on the specified database.

### Use Case 10: File Actions (Read/Write)

Prompt Example: "Create a text file named notes.txt with the following content: Meeting notes...."
Description: Saiku will utilize the file_action function to write the provided content into a new text file called notes.txt.
## Future Features

- ~~**Incorporation of Diverse Models**: While currently relying on OpenAI and its code interpreter, future versions of Saiku aim to incorporate various other AI and LLM models to enhance its capabilities and versatility~~
- **Web Compatible Version**: Development of a web-compatible version of Saiku to ensure easy accessibility and integration into web-based platforms.
- **Python Version**: Creation of a Python version of Saiku to cater to Python developers and AI enthusiasts, allowing seamless integration into Python-centric projects.
- **Configuration Management**: Implementation of a robust configuration management system to ensure Saiku’s smooth and efficient operation in diverse environments.
- **Enhanced Debugging and Logging**: Improvement in debugging and logging capabilities for easier identification and resolution of issues, ensuring Saiku's robust performance.
- **Comprehensive Tests**: Development of comprehensive tests to continuously evaluate and ensure Saiku's functionality, reliability, and performance.
- ~~**Voice Commands**: Integration with technologies like Whisper for efficient and user-friendly voice command functionalities.~~
- ~~**Speaking Agent**: Implementation of Text-to-Speech technologies like Elevenlabs, enabling Saiku to interact using voice, enhancing user experience.~~
- **Enhanced Memory Handling**: Upgrades in memory handling for optimal and consistent performance.
- **Document Summarization**: Integration of document summarization features for effective handling of large textual data.
- **Advanced Actions**: Inclusion of computer vision and image interpretation capabilities, broadening the spectrum of tasks Saiku can adeptly handle.
- **OpenAI Cost Tracking**: Incorporating features to track and analyze the costs associated with OpenAI API usage, enabling better budget management and cost-efficiency.
- **Budget Settings**: Implementation of budget settings to allow users to set and manage spending limits on AI resources, ensuring cost-effective operation.
- **Multi-Agent Systems**: Exploration and integration of multi-agent systems to promote collaborative problem-solving and to enrich the PEAS framework within Saiku, potentially elevating the project's ability to handle complex, dynamic environments.
- **PEAS Enhancement**: Further refining the existing PEAS framework to accommodate a wider range of environments, actuator capabilities, and sensor inputs, aiming for a more versatile and adaptive AI agent.

## Contributing

We welcome contributions from the community. If you'd like to contribute, please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git commit push origin feature/YourFeature`)
5. Create a new Pull Request

[Contributing Guidelines](CONTRIBUTING.md).

## Support Saiku

We are actively seeking sponsors and contributors. If you believe in the potential of Saiku, support the project in any way you can. Your support will help us make Saiku a reality.

## Feedback and Issues

We value your feedback. If you encounter any issues or have suggestions for improvements, please open an issue on our GitHub repository.

## API Rate Limits/Cost

Please be aware of the rate limits and costs associated with the APIs used by Saiku. Each service provider may have different policies, and it's essential to stay informed to avoid unexpected charges.

## Note

Please note that we are in the experimental stage. The architecture and features are subject to significant changes.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
