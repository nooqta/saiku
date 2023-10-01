# Contributing to Question-Answering AI Agent

First off, thank you for considering contributing to Question-Answering AI Agent. It's people like you that make Question-Answering AI Agent such a great tool.

## Getting Started

- Make sure you have the latest version of Node.js and npm installed.
- Make sure you have git installed.
- Fork the repository.

## Code of Conduct

We enforce a Code of Conduct for all maintainers and contributors of this project. Please read [the full text](CODE_OF_CONDUCT.md) so that you can understand what actions will and will not be tolerated.

## Issue Contributions

- **Major Changes**: If you want to do anything more than a small fix: Submit an issue to discuss your ideas before applying any changes.
- **Small Changes**: For small changes (like typos and such) feel free to create a pull request without creating an issue first.

## Code Contributions

Here's a rough outline of what the workflow for code contributions will look like:

1. Fork the project.
2. Clone your fork.
3. Add a new remote to reference the main project.
    ```
    git remote add upstream https://github.com/anis-marrouchi/question-answering-ai-agent.git
    ```
4. Pull the latest changes from the main project's `main` branch.
    ```
    git pull upstream main
    ```
5. Create a new branch for your work.
    ```
    git checkout -b feature/my-feature
    ```
6. Make your changes.
7. Push your changes back to your fork on GitHub.
    ```
    git push origin feature/my-feature
    ```
8. Submit a pull request from your fork to the project's `main` branch.

## Pull Request Process

1. Ensure any install or build dependencies are removed before the end of the layer when doing a build.
2. Update the README.md if any changes invalidate its current content.
3. Submit the pull request. Include a description of the changes.
4. After approval, the pull request will be merged by a maintainer.