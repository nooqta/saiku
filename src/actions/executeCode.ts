import Agent from "@/agents/agent";
import { Action } from "@/interfaces/action";
import { spawn } from "child_process";
import { marked } from "marked";
import TerminalRenderer from "marked-terminal"
interface LanguageRunner {
  runCode(code: string): Promise<string>;
}

class GeneralRunner implements LanguageRunner {
  async runCode(commandString: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Splitting the command string into command and arguments
      const parts = commandString.split(' ');
      const command = parts[0];
      const args = parts.slice(1);

      const child = spawn(command, args); // Updated to use command and args

      let stderr = "";
      let scriptOutput = "";
      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });
      child.stdout.setEncoding("utf8");
      child.stdout.on("data", function (data) {
        data = data.toString();
        scriptOutput += data;
      });

      child.on("error", (error) => reject(error));
      child.on("exit", (code) => {
        if (code === 0) {
          resolve(`Execution complete. ${scriptOutput}`);
        } else {
          reject(`Exit with code: ${code}\nError Output:\n${stderr}`);
        }
      });
    });
  }
}


// class PHPRunner implements LanguageRunner {
//   async runCode(code: string): Promise<string> {
//     return new Promise((resolve, reject) => {
//       const child = spawn("php", ["-r", code]);

//       let stderr = "";
//       let scriptOutput = "";
//       child.stderr.on("data", (data) => {
//         stderr += data.toString(); // collect standard error output
//       });

//       child.stdout.setEncoding("utf8");
//       child.stdout.on("data", function (data) {
//         data = data.toString();
//         scriptOutput += data;
//       });

//       child.on("error", (error) => reject(error));
//       child.on("exit", (code) => {
//         if (code === 0) {
//           resolve(`Execution complete. ${scriptOutput}`);
//         } else {
//           reject(`Exit with code: ${code}\nError Output:\n${stderr}`); // include standard error output in the rejection
//         }
//       });
//     });
//   }
// }

class PythonRunner {
  async runCode(code: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn("python3", ["-u", "-c", code]);

      let stderr = '';
      let stdout = '';

      child.stderr.setEncoding('utf8');
      child.stderr.on('data', (data) => {
        stderr += data; // collect standard error output
      });

      child.stdout.setEncoding('utf8');
      child.stdout.on('data', (data) => {
        stdout += data;
      });

      child.on('error', (error) => {
        reject(`Script error: ${error.message}`);
      });

      child.on('exit', (code) => {
        if (stderr) {
          reject(`Script completed with errors:\n${stderr}`);
        } else if (code !== 0) {
          reject(`Script exited with code ${code} and no output.`);
        } else {
          resolve(stdout || 'Script completed with no output.');
        }
      });
    });
  }
}



class ShellRunner implements LanguageRunner {
  async runCode(code: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn("sh", ["-c", code]);  // Remove the stdio option
      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => {
        stdout += data.toString()
        console.log(data.toString())
      });  // Correct event handler attachment
      child.stderr.on("data", (data) => stderr += data.toString());  // Capture stderr as well

      child.on("error", (error) => reject(error));
      child.on("exit", (code) =>
        code === 0
          ? resolve(`${stdout}`)
          : reject(`Exit with code: ${code}\nError Output:\n${stderr}`)  // Include stderr in rejection
      );
    });
  }
}


class NodeRunner implements LanguageRunner {
  async runCode(code: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn("node", ["-e", code]);  // Remove the stdio option
      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => stdout += data.toString());
      child.stderr.on("data", (data) => stderr += data.toString());

      child.on("error", (error) => reject(error));
      child.on("exit", (code) =>
        code === 0
          ? resolve(`Execution complete. ${stdout}`)
          : reject(`Exit with code: ${code}\nError Output:\n${stderr}`)  // Include stderr in rejection
      );
    });
  }
}


class AppleScriptRunner implements LanguageRunner {
  async runCode(code: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn("osascript", ["-e", code]);  // Remove the stdio option
      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => stdout += data.toString());
      child.stderr.on("data", (data) => stderr += data.toString());

      child.on("error", (error) => reject(error));
      child.on("exit", (code) =>
        code === 0
          ? resolve(`Execution complete. ${stdout}`)
          : reject(`Exit with code: ${code}\nError Output:\n${stderr}`)  // Include stderr in rejection
      );
    });
  }
}

export default class ExecuteCodeAction implements Action {
    dependencies = ["marked","marked-terminal"];
  agent: Agent;
  name = "execute_code";
  description = "Execute code in a specific language";
  parameters =[
    {
      name: "language",
      type: "array",
      required: true,
      items: {
        type: "string",
        enum: [
          "python",
          // "php",
          "shell",
          "bash",
          "javascript",
          "applescript",
          "AppleScript",
          "pip",
          "command",
        ],
      },
    },
    { name: "code", type: "string", required: true },
  ];
// Constructor
constructor(agent: Agent) {
  this.agent = agent;
}
  async run(args: { language: string; code: string }): Promise<string> {
    let runner: LanguageRunner;
    marked.setOptions({
      renderer: new TerminalRenderer(),
    });
    console.log(marked(args.code));
    switch (args.language) {
      case "pip":
      case "command":
        runner = new GeneralRunner();
        break;
      case "python":
        runner = new PythonRunner();
        break;
      // case "php":
      //   runner = new PHPRunner();
      //   break;
      case "shell":
      case "bash":
        runner = new ShellRunner();
        break;
      case "applescript":
      case "AppleScript":
        runner = new AppleScriptRunner();
        break;
      case "javascript":
        runner = new NodeRunner();
        break;
      default:
        runner = new GeneralRunner();
    }
    try {
      const output = await runner.runCode(args.code);
      console.log(output);
      return `output is: ${output}`;
    } catch (error: any) {
      let errorInfo;
      if (typeof error === "string") {
        // If error is a string, use it as the message.
        errorInfo = { message: error };
      } else {
        // Otherwise, assume error is an object with a message and possibly a stack property.
        errorInfo = {
          message: error.message,
          stack: error.stack,
        };
      }
      return JSON.stringify(errorInfo);
    }
  }
}
