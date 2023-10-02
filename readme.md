# Saiku (細工) The AI Agent

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

## Installation

Clone this repository:

```
git clone https://github.com/nooqta/saiku.git
```

Navigate to the project folder:

```
cd saiku
```

Install dependencies:

```
npm install
```

### Global Installation (Not Recommended Yet)

Although Saiku is available as an npm package, we are still in the early stages of development, and drastic changes to the architecture will occur. We don't recommend installing it globally yet. However, if you still wish to do so:

```
npm install -g saiku
```

## Usage

### Running the Project Locally

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
### Setting Up Environment Variables

Before running Saiku, configure the necessary environment variables. Copy the example environment file and then fill in the details.

```
cp .env.example .env
```

Edit the `.env` file to include your specific information:

```
OPENAI_API_KEY=
OPENAI_MODEL=
DB_HOST=
DB_USER=
DB_PASSWORD=
EMAIL_PASS=
EMAIL_USER=
DISPLAY_FROM_EMAIL=
USER=
COMPANY=
COUNTRY=
CITY=
PHONE=
```

### Command Line Options

Use Saiku with various options to tailor its operation to your needs:

```
Usage: saiku [options]

AI agent to help automate your tasks
```

#### Options:

```
  -v, --version                Output the current version
  -exec, --allowCodeExecution  Execute the code without prompting the user. (default: false)
  -h, --help                   Display help for command
```

For example, to allow code execution without prompting:

```
saiku -exec
```

## Future Features

- **Incorporation of Diverse Models**: While currently relying on OpenAI and its code interpreter, future versions of Saiku aim to incorporate various other AI and LLM models to enhance its capabilities and versatility
- **Web Compatible Version**: Development of a web-compatible version of Saiku to ensure easy accessibility and integration into web-based platforms.
- **Python Version**: Creation of a Python version of Saiku to cater to Python developers and AI enthusiasts, allowing seamless integration into Python-centric projects.
- **Configuration Management**: Implementation of a robust configuration management system to ensure Saiku’s smooth and efficient operation in diverse environments.
- **Enhanced Debugging and Logging**: Improvement in debugging and logging capabilities for easier identification and resolution of issues, ensuring Saiku's robust performance.
- **Comprehensive Tests**: Development of comprehensive tests to continuously evaluate and ensure Saiku's functionality, reliability, and performance.
- **Voice Commands**: Integration with technologies like Whisper for efficient and user-friendly voice command functionalities.
- **Speaking Agent**: Implementation of Text-to-Speech technologies like Elevenlabs, enabling Saiku to interact using voice, enhancing user experience.
- **Enhanced Memory Handling**: Upgrades in memory handling for optimal and consistent performance.
- **Document Summarization**: Integration of document summarization features for effective handling of large textual data.
- **Advanced Actions**: Inclusion of computer vision and image interpretation capabilities, broadening the spectrum of tasks Saiku can adeptly handle.

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

## Note

Please note that we are in the experimental stage. The architecture and features are subject to significant changes.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.