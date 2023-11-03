import Vision, { ImageAnnotatorClient } from '@google-cloud/vision';
import { Action } from "@/interfaces/action";
import { promises as fsPromises } from 'fs';
import axios from 'axios';
import Agent from '@/agents/agent';

export default class GoogleVisionAction implements Action {
    dependencies = ["@google-cloud/vision","axios"];
  name = "google_vision";
  description = "Analyze an image using Google Cloud Vision API";
  arguments = [
    { name: "imageSource", type: "string", required: true },
    { name: "features", type: "array", required: true, items: { type: "string", enum: ["DOCUMENT_TEXT_DETECTION", "FACE_DETECTION", "LABEL_DETECTION", "IMAGE_PROPERTIES", "WEB_DETECTION"] }}
  ];


private visionClient:  ImageAnnotatorClient;

  constructor(agent: Agent) {
    // Instantiate the Vision client
    this.visionClient = new Vision.ImageAnnotatorClient();
    this.agent = agent;
  }
  agent: Agent;

  async run(args: { imageSource: string, features: string[] }): Promise<any> {
    const {features} = args;
    console.log('features', features);
    try {
        let imageBuffer: Buffer;

        if (args.imageSource.startsWith('http://') || args.imageSource.startsWith('https://')) {
          // The image source is a URL
          const response = await axios.get(args.imageSource, { responseType: 'arraybuffer' });
          imageBuffer = Buffer.from(response.data, 'binary');
        } else {
          // The image source is a local file path
          const fileData = await fsPromises.readFile(args.imageSource);
          imageBuffer = Buffer.from(fileData);
        }

      // Send the image to the Cloud Vision API
      const request = {
        "image": {
            "content": imageBuffer.toString('base64')
        },
        "features": features.map(feature => ({ "type": feature })),
    };
      const [result] = await this.visionClient.annotateImage(request);

      // Extract the annotations from the API response
    //   const annotations = result.textAnnotations;
      return JSON.stringify({...result.labelAnnotations?.map(label => label.description), ...{text: result.fullTextAnnotation?.text}});

    } catch (error) {
        console.error('ERROR:', error);
      return `An error occurred: ${JSON.stringify(error)}`;
    }
  }

}
