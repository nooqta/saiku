import { Action } from "@/interfaces/action";
import * as fs from 'fs';
import * as ffmpeg from 'fluent-ffmpeg';
import { Readable } from 'stream';
import OpenAI from "openai";
import * as readline from 'readline';
import Agent from "@/agents/agent";

// Setup ffmpeg path
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
ffmpeg.setFfmpegPath(ffmpegPath);

// Instantiate OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default class SpeechToTextAction implements Action {
    static dependencies = ["fluent-ffmpeg","openai", "@ffmpeg-installer/ffmpeg"];
  agent: Agent;
  name = "speech_to_text";
  description = "Transcribe audio to text";
  arguments = [{ name: "audioFilename", type: "string", required: false }];

  
  private audioFilename = 'recording.wav';

  async init() {
    // Initialize any other setup tasks if necessary
    // ... 
  }
// Constructor
constructor(agent: Agent) {
  this.agent = agent;
}
  async run(args: {audioFilename?: string} = {}): Promise<string> {
    await this.init();
    const audioFilename = args.audioFilename || this.audioFilename;
    if (!args.audioFilename) {
      await this.recordAudio(audioFilename);
    }
    const transcription = await this.transcribeAudio(audioFilename);
    console.log('Transcription:', transcription);
    return transcription;
  }

  async recordAudio(filename: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const mic = require("mic");
      const micInstance = mic({
        rate: "16000",
        channels: "1",
        fileType: "wav",
      });

      const micInputStream = micInstance.getAudioStream();
      const output = fs.createWriteStream(filename);
      const writable = new Readable().wrap(micInputStream);

      console.log("Recording... Press ENTER to stop.");

      writable.pipe(output);

      micInstance.start();

     // Setup readline to listen for keyboard input
     const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
  });

  // Listen for ENTER key press (a newline character in the input stream)
  rl.on('line', (input) => {
      if (input === '') {  // An empty string represents an ENTER key press
          micInstance.stop();
          console.log("Finished recording");
          rl.close();
          resolve();
      }
  });

      micInputStream.on("error", (err: any) => {
        reject(JSON.stringify(err));
      });
    });
  }

  async transcribeAudio(filename: string): Promise<string> {
    const transcript = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filename),
      model: "whisper-1",
    });
    return transcript.text;  // Adjusted to access text directly from transcript object
  }

  async close() {
    // Clean up resources if necessary
    // ...
  }
}
