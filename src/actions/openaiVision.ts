import { Action, Argument } from '../interfaces/action';
import fs from 'fs';
import path from 'path';
import { OpenAI } from 'openai';
import fetch from 'node-fetch';
import ffmpeg from 'fluent-ffmpeg';
import dotenv from 'dotenv';
import ytdl from 'ytdl-core';
import { pipeline } from 'stream';
import { promisify } from 'util';
import Agent from '@/agents/agent';
dotenv.config();

export default class OpenaiVisionAction implements Action {
    agent: Agent;
    dependencies = ['ytdl-core', 'fluent-ffmpeg', 'node-fetch', 'openai' ];
    name = 'openai_vision';
    description = 'Analyze a video using OpenAI Vision.';
    parameters = [
        { name: 'source', type: 'string', required: true, description: 'Local path or URL of the video.' }
    ];

    constructor(agent: Agent) {
        this.agent = agent;
    }

    async run(args: { source: string }): Promise<any> {
        const isUrl = /^https?:\/\//.test(args.source);
        let filePath = args.source;

        if (isUrl) {
            filePath = await this.downloadVideo(args.source);
        }

        const framesPath = 'tmp/video/frames';
        if (!fs.existsSync(framesPath)) {
            fs.mkdirSync(framesPath, { recursive: true });
        }
        await this.extractFrames(filePath, framesPath);

        const base64Frames = await this.encodeFramesToBase64(framesPath);
        const videoDescription = await this.analyzeVideo(base64Frames);

        return videoDescription;
    }

async downloadVideo(url: string) {
    const tempDir = path.join(process.cwd(), 'tmp/videos');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const filePath = path.join(tempDir, `downloaded_${Date.now()}.mp4`);

    if (ytdl.validateURL(url)) {
        // For YouTube videos
        try {
            await promisify(pipeline)(
                ytdl(url, { quality: 'lowest' }),
                fs.createWriteStream(filePath)
            );
        } catch (error) {
            // @ts-ignore
            throw new Error(`Error downloading YouTube video: ${error.message}`);
        }
    } else {
        // For other URLs
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`unexpected response ${response.statusText}`);
            await new Promise((resolve, reject) => {
                const fileStream = fs.createWriteStream(filePath);
                response.body.pipe(fileStream);
                response.body.on('error', reject);
                fileStream.on('finish', resolve);
            });
        } catch (error) {
            // @ts-ignore
            throw new Error(`Error downloading video: ${error.message}`);
        }
    }

    return filePath;
}


    async extractFrames(videoPath: string , outputPath: string) {
        // Extract frames from the video
        return new Promise((resolve, reject) => {
            console.log(videoPath)
            ffmpeg(videoPath)
                .outputOptions([`-vf fps=1`])
                .output(`${outputPath}/frame-%03d.jpg`)
                .on('end', resolve)
                .on('error', reject)
                .run();
        });
    }

    async encodeFramesToBase64(outputPath: fs.PathLike) {
        // Ensure output directory exists
        if (!fs.existsSync(outputPath)) {
            throw new Error('Output directory does not exist.');
        }

        const frameFiles = fs.readdirSync(outputPath).filter(file => file.endsWith('.jpg'));
        return Promise.all(frameFiles.map(frameFile => {
            const imagePath = `${outputPath}/${frameFile}`;
            return fs.readFileSync(imagePath, 'base64');
        }));
    }

    async analyzeVideo(base64Frames: any[]) {
        const openai = new OpenAI();

        // Prepare the request for OpenAI's Vision API
        const opts = {
            model: "gpt-4-vision-preview",
            max_tokens: 500,
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "These are frames from a video. Generate summary about what the video is about." },
                        ...base64Frames.filter((_: any, index: number) => index % 10 === 0).map((imageBase64: any) => ({
                            type: "image_url",
                            image_url: `data:image/jpeg;base64,${imageBase64}`
                        })),
                    ],
                },
            ],
        };

        // Send the request and receive the response
        // @ts-ignore
        const response = await openai.chat.completions.create(opts);
        return response.choices[0].message.content;
    }
}
