import { Action } from '../interfaces/action';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import Agent from '@/agents/agent';

const execAsync = util.promisify(exec);

export default class GitAction implements Action {
  dependencies = []; // Dependencies for git, normally git would be pre-installed
  agent: Agent;
  name = 'git_action';
  description = 'Execute a Git command';
  parameters = [
    { name: 'command', type: 'string', required: true, description: 'The git command to execute' },
    { name: 'path', type: 'string', required: false, description: 'The path to the repository' }
  ];

  constructor(agent: Agent) {
    this.agent = agent;
  }

  async run(args: { command: string, path?: string }): Promise<any> {
    const workingDir = args.path ? path.resolve(args.path) : process.cwd();
    const cmd = `git -C "${workingDir}" ${args.command}`;
    
    try {
      const { stdout, stderr } = await execAsync(cmd);
      if (stderr) throw new Error(stderr);
      console.log(stdout);
      return stdout;
    } catch (error) {
      // @ts-ignore
      console.error(`Error executing Git command: ${error.message}`);
      throw error;
    }
  }
}
