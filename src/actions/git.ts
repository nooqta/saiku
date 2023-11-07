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
  description = 'Perform common Git operations';
  parameters =[
    { name: 'operation', type: 'string', required: true, enum: ['clone', 'add', 'commit', 'push', 'pull', 'init'], description: 'Git operation to perform' },
    { name: 'repository', type: 'string', required: false },
    { name: 'path', type: 'string', required: false },
    { name: 'message', type: 'string', required: false, description: 'Commit message. Required for commit operation.' }
  ];
  
  constructor(agent: Agent) {
    this.agent = agent;
  }

  async run(args: { operation: string, repository?: string, path?: string, message?: string }): Promise<any> {
    let cmd;
    const workingDir = args.path ? path.resolve(args.path) : process.cwd();
    
    switch (args.operation) {
      case 'clone':
        if (!args.repository) throw new Error('Repository URL is required for clone operation');
        cmd = `git clone ${args.repository} "${workingDir}"`;
        break;
      case 'add':
        cmd = `git -C "${workingDir}" add .`;
        break;
      case 'commit':
        if (!args.message) throw new Error('Commit message is required for commit operation');
        cmd = `git -C "${workingDir}" commit -m "${args.message}"`;
        break;
      case 'push':
        cmd = `git -C "${workingDir}" push`;
        break;
      case 'pull':
        cmd = `git -C "${workingDir}" pull`;
        break;
      case 'init':
        cmd = `git -C "${workingDir}" init`;
        break;
      default:
        throw new Error(`Invalid Git operation: ${args.operation}`);
    }

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
