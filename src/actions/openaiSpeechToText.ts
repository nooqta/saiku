import { Action } from '../interfaces/action';
import fs from 'fs';
import path from 'path';
import { OpenAI } from 'openai';
import ffmpeg from 'fluent-ffmpeg';
import Agent from '@/agents/agent';
import ytdl from 'ytdl-core';
import { pipeline } from 'stream';
import { promisify } from 'util';
import fetch from 'node-fetch';
import { videoFormat } from 'ytdl-core';

import dotenv from 'dotenv';
dotenv.config();

export default class OpenaiAudioAction implements Action {
    agent: Agent;
    dependencies = ['fluent-ffmpeg', 'openai'];
    name = 'openai_audio';
    description = 'Extracts audio from a video and performs speech-to-text using OpenAI.';
    parameters = [
        { name: 'source', type: 'string', required: true, description: 'Local path of the video.' }
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
        const audioPath = await this.extractAudio(filePath);
        const transcription = await this.transcribeAudio(audioPath);
        return transcription;
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
                    // @ts-ignore
                    ytdl(url, { filter: 'audioandvideo'}),
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

    async extractAudio(videoPath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const outputPath = path.join(process.cwd(), 'tmp/audio');
            if (!fs.existsSync(outputPath)) {
                fs.mkdirSync(outputPath, { recursive: true });
            }
    
            const audioFilePath = path.join(outputPath, 'extracted_audio.mp3');
    
            ffmpeg(videoPath)
                .noVideo()
                .audioCodec('libmp3lame')
                .on('end', () => resolve(audioFilePath))  // Resolve the promise when extraction is complete
                .on('error', (err) => reject(err))        // Reject the promise on error
                .save(audioFilePath);
        });
    }

    async transcribeAudio(audioPath: string): Promise<string> {
        const openai = new OpenAI();
        const audioStream = fs.createReadStream(audioPath);
        const transcription = await openai.audio.transcriptions.create({
            file: audioStream,
            model: 'whisper-1',
        });

        return transcription.text;
    }
}
