import fs from 'fs/promises';
import path from 'path';
import McpClientManager from '../mcp/client'; // Use correct class name and default import
// Removed dot-prop import

// Define interfaces for Workflow structure (matching workflows.json)
// Consider moving these interfaces to a shared types file (e.g., src/interfaces/workflow.ts)
interface WorkflowStep {
    id?: string;
    server: string;
    tool: string;
    arguments: Record<string, any>;
    condition?: string; // Placeholder for future conditional logic
    // Add other potential fields like description, timeout, etc. if needed
}

interface Workflow {
    name: string;
    description?: string;
    steps: WorkflowStep[];
}

interface WorkflowFile {
    workflows: Workflow[];
}

interface ExecutionContext {
    steps: Record<string, { result?: any; error?: any }>;
    globals: Record<string, any>;
    // Add other context info like platform, env vars if needed for conditions
}

export class WorkflowRunner {
    private workflows: Workflow[] = [];
    private mcpClientManager: McpClientManager; // Use the manager instance

    // Accept an initialized McpClientManager instance
    constructor(mcpClientManager: McpClientManager) {
        if (!mcpClientManager) {
            throw new Error("WorkflowRunner requires an initialized McpClientManager instance.");
        }
        this.mcpClientManager = mcpClientManager;
    }

    // Make loadWorkflows public if needed by list command directly, or keep private
    async loadWorkflows(filePath: string = 'workflows.json'): Promise<void> {
        try {
            const fullPath = path.resolve(process.cwd(), filePath);
            const data = await fs.readFile(fullPath, 'utf-8');
            const workflowData: WorkflowFile = JSON.parse(data);
            if (!workflowData || !Array.isArray(workflowData.workflows)) {
                throw new Error('Invalid workflow file format. Expected { "workflows": [...] }');
            }
            this.workflows = workflowData.workflows;
            // console.log(`Loaded ${this.workflows.length} workflows from ${filePath}`); // Removed log
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                // console.warn(`Workflow file not found at ${filePath}. No workflows loaded.`); // Removed log
                this.workflows = [];
            } else {
                console.error(`Error loading workflows from ${filePath}:`, error); // Keep error
                throw new Error(`Failed to load workflows: ${error.message}`);
            }
        }
    }

    findWorkflow(name: string): Workflow | undefined {
        return this.workflows.find(wf => wf.name === name);
    }

    // Getter to expose loaded workflows
    getWorkflows(): Workflow[] {
        return this.workflows;
    }

    private resolveArgument(arg: any, context: ExecutionContext): any {
        if (typeof arg !== 'string') {
            return arg; // Only resolve string arguments
        }

        const match = arg.match(/^\${(steps\.([a-zA-Z0-9_]+)\.result\.(.+)|globals\.([a-zA-Z0-9_]+))}$/);
        if (!match) {
            return arg; // Not a valid template string
        }

        // Example: ${steps.generate_speech.result.filePath}
        // match[1] = steps.generate_speech.result.filePath
        // match[2] = generate_speech (stepId)
        // match[3] = filePath (propertyPath)
        // Example: ${globals.myVar}
        // match[1] = globals.myVar
        // match[4] = myVar (globalVarName)

        if (match[2] && match[3]) { // Step result reference
            const stepId = match[2];
            const propertyPath = match[3];
            const stepResult = context.steps[stepId]?.result;
            if (stepResult === undefined) {
                // console.warn(`Warning: Step result for '${stepId}' not found in context.`); // Removed log
                return undefined; // Or throw error? Or return the template string?
            }
            // Use custom helper to safely access nested properties
            return this.getNestedProperty(stepResult, propertyPath);
        } else if (match[4]) { // Global variable reference
            const globalVarName = match[4];
            if (!(globalVarName in context.globals)) {
                 // console.warn(`Warning: Global variable '${globalVarName}' not found in context.`); // Removed log
                 return undefined;
            }
            return context.globals[globalVarName];
        }

        return arg; // Should not happen with the regex, but fallback
    }

    private resolveArguments(args: Record<string, any>, context: ExecutionContext): Record<string, any> {
        const resolvedArgs: Record<string, any> = {};
        for (const key in args) {
            const value = args[key];
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                // Recursively resolve nested objects
                resolvedArgs[key] = this.resolveArguments(value, context);
            } else if (Array.isArray(value)) {
                 // Resolve each item in an array
                resolvedArgs[key] = value.map(item => this.resolveArgument(item, context));
            }
            else {
                resolvedArgs[key] = this.resolveArgument(value, context);
            }
        }
        return resolvedArgs;
    }

    // Helper function to safely get nested properties
    private getNestedProperty(obj: any, pathString: string): any {
        if (!obj || typeof pathString !== 'string') {
            return undefined;
        }
        const properties = pathString.split('.');
        let current = obj;
        for (const prop of properties) {
            if (current === null || current === undefined || typeof current !== 'object') {
                return undefined;
            }
            current = current[prop];
        }
        return current;
    }


    async runWorkflow(name: string): Promise<ExecutionContext> {
        await this.loadWorkflows(); // Ensure workflows are loaded

        const workflow = this.findWorkflow(name);
        if (!workflow) {
            throw new Error(`Workflow "${name}" not found.`);
        }

        // console.log(`Running workflow: ${name}`); // Removed log
        const context: ExecutionContext = { steps: {}, globals: {} };

        for (const step of workflow.steps) {
            // console.log(`\nExecuting step: ${step.id ?? '(unnamed)'} (Server: ${step.server}, Tool: ${step.tool})`); // Removed log

            // TODO: Implement condition checking using step.condition and context

            try {
                const resolvedArguments = this.resolveArguments(step.arguments, context);
                

                // McpClientManager should be initialized and connected beforehand
                if (!this.mcpClientManager) { // Should not happen if constructor enforces it
                     throw new Error("MCP Client Manager not available.");
                }
                // No need for ensureConnected call here

                // Format the tool name as expected by McpClientManager
                const prefixedToolName = `${step.server}/${step.tool}`;

                // Call the MCP tool via the manager
                const result = await this.mcpClientManager.callTool(prefixedToolName, resolvedArguments);

                

                // console.log('Step Result:', JSON.stringify(result, null, 2)); // Removed log

                if (step.id) {
                    // Attempt to parse JSON result, otherwise store raw result
                    let stepResultData: any = result;
                    if (result?.content?.[0]?.text) {
                        try {
                            stepResultData = JSON.parse(result.content[0].text);
                        } catch (parseError) {
                            // If parsing fails, store the raw text content
                            stepResultData = result.content[0].text;
                        }
                    }
                    context.steps[step.id] = { result: stepResultData };
                }

                if (result?.isError) {
                     const errorMessage = result.content?.[0]?.text ?? 'Unknown error';
                     console.error(`Step ${step.id ?? '(unnamed)'} failed:`, errorMessage); // Keep error log
                     context.steps[step.id ?? 'last_error'] = { error: errorMessage };
                     // Decide whether to stop or continue on error
                     throw new Error(`Step ${step.id ?? '(unnamed)'} failed.`);
                }

            } catch (error: any) {
                console.error(`Error executing step ${step.id ?? '(unnamed)'}:`, error);
                 if (step.id) {
                    context.steps[step.id] = { error: error.message ?? error };
                 }
                // Rethrow to stop the workflow execution
                throw error;
            }
        }

        // console.log(`\nWorkflow "${name}" completed successfully.`); // Removed log
        return context;
    }
}

// Example Usage (for testing purposes, would be called by CLI command)
/*
async function testRun() {
    // Initialization would happen elsewhere (e.g., in the CLI command setup)
    const settingsPath = path.resolve(process.cwd(), 'mcp-settings.json'); // Or wherever settings are
    const clientManager = new McpClientManager(settingsPath);
    await clientManager.initializeAndConnectServers();

    if (!clientManager.hasActiveConnections()) {
        console.error("MCP Client Manager failed to connect to any servers. Workflow cannot run.");
        return;
    }

    const runner = new WorkflowRunner(clientManager); // Pass the initialized manager
    try {
        const finalContext = await runner.runWorkflow('example-tts-workflow');
        console.log('\nFinal Execution Context:', JSON.stringify(finalContext, null, 2));
    } catch (error) {
        console.error('\nWorkflow execution failed:', error);
    } finally {
        // Disconnect all servers when done
        await clientManager.disconnectAll();
    }
}

// testRun(); // Uncomment to run test
*/
