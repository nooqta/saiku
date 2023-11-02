import Agent from "@/agents/agent";
import { Action } from "@/interfaces/action";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import { OpenAI } from "openai";
import * as fs from "fs";
import sharp from "sharp";
import { join } from "path";
interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
}
interface TextRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
}

function extractTextRectanglesFromAnnotations(
  textAnnotations: any[]
): TextRectangle[] {
  return textAnnotations.map((annotation) => {
    const vertices = annotation.boundingPoly.vertices;
    return {
      x: vertices[0].x,
      y: vertices[0].y,
      width: vertices[1].x - vertices[0].x,
      height: vertices[3].y - vertices[0].y,
      text: annotation.description,
    };
  });
}

export default class ImageToWebPageAction implements Action {
    static dependencies = ["@google-cloud/vision","openai","sharp"];
  name = "imageToWebPage";
  description = "Generate HTML and CSS from an image of a web page design";
  arguments = [
    {
      name: "imagePath",
      type: "string",
      required: true,
      description: "Path to the uploaded image.",
    },
  ];
  openai: any;
  visionClient: any;
  agent: Agent;

  constructor(agent: Agent) {
    this.agent = agent;
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.visionClient = new ImageAnnotatorClient();
  }

  generatePlaceholderImageUrl(
    width: number,
    height: number,
    name: string = "Image"
  ): string {
    const w = Math.round(width * 1000); // multiplying by a factor for better resolution
    const h = Math.round(height * 1000);
    return `https://placehold.co/${w}x${h}?text=${name}`;
  }

  async generateHTML(description: string): Promise<string> {
    const basePrompt = `
    Based on the provided visual description, identify and create the closest Bootstrap component for each described HTML element. Consider the following guidelines:

- Correct any spelling and grammar inaccuracies.
- Organize elements based on their positions.
- Implement grid systems for rows and columns. Avoid absolute positioning.
- Refrain from using fixed dimensions or large spacings.
- Elements near the top might belong to a navbar or header.
- Components at the bottom could signify a footer.
- Elements on either side may be sidebars.
- Large sections at the top might be headers, while those at the bottom could be footers.
- Repeated patterns might indicate lists, galleries, blog posts, or cards.
- Small icons or text at the top-left are potentially logos.
- Large visuals could be hero images, and small ones might be thumbnails.
- Text size will help in distinguishing between headings and paragraphs.
- Side-aligned elements can be treated as columns.
- For logo images, use the placeholder service to generate a random image: https://placehold.co/{w}x{h}?text={name}.
- For images, use unsplash service to generate a random image: https://unsplash.it/{w}/{h}?{tag}.

Given the design description: ${description}, produce a neat, organized, and responsive HTML structure using Bootstrap components:

HTML OUTPUT EXAMPLE:
<html>
<head>
<title>Page name</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css" integrity="sha384-xOolHFLEh07PJGoPkLv1IbcEPTNtaed2xpHsD9ESMhqIYd0nLMwNLD69Npy4HI+N" crossorigin="anonymous">
<style>
    /* Color Palette derived from description using Bootstrap naming. To be used in the html */
    /* Any additional CSS following Bootstrap conventions. To be used in the html */
</style>
</head>
<body>
<!-- Content derived from the description -->
</body>
</html>

    `;

    const response = await this.openai.chat.completions.create({
      messages: [
        { role: "system", content: basePrompt },
        {
          role: "system",
          content:
            "Start by identifying the Bootstrap components based on their positions and potential roles in the page layout. Insert image source  into their corresponding img tag.",
        },
        {
          role: "system",
          content:
            "Now, detail the HTML and CSS using Bootstrap. Add any missing elements like buttons for Jumptrons and cards",
        },
        {
            role: "user",
            // @ts-ignore
            content: `Initial user input: ${this.agent.messages.findLast((message) => message.role === "user")?.content}`
        }
      ],
      model: "gpt-3.5-turbo",
    });


    return response.choices[0]?.message?.content.trim();
  }

  async run(args: any): Promise<string> {
    const imagePath = args.imagePath;

    try {
      console.log("Detecting features using Google Vision...");
      const visionOutput = await this.visionClient
        .annotateImage({
          image: { source: { filename: imagePath } },
          features: [
            { type: "TEXT_DETECTION" },
            { type: "OBJECT_LOCALIZATION" },
            { type: "LOGO_DETECTION" },
            { type: "IMAGE_PROPERTIES" },
            { type: "LABEL_DETECTION" },
          ],
        })
        .then((responses: any[]) => responses[0]);

      console.log("Enhancing description from vision output...");
      const detailedDescription = await this.enhanceDescription(
        visionOutput,
        imagePath
      );

      console.log("Generating HTML using OpenAI...");
      const code = await this.generateHTML(detailedDescription);
      // Save the code to a file
      fs.writeFileSync("output.html", code);
      return code;
    } catch (error) {
      console.error("Error occurred:", error);
      return `Error occurred: ${JSON.stringify(error)}`;
    }
  }
  isWithin(
    boundary1: { x: number; y: number; width: any; height: any },
    boundary2: { x: number; y: number; width: any; height: any }
  ) {
    return (
      boundary1.x >= boundary2.x &&
      boundary1.y >= boundary2.y &&
      boundary1.x + boundary1.width <= boundary2.x + boundary2.width &&
      boundary1.y + boundary1.height <= boundary2.y + boundary2.height
    );
  }

  describeElement(element: {
    type?: any;
    text?: any;
    fontSize?: any;
    x?: any;
    y?: any;
    width?: any;
    height?: any;
    dominantColor?: any;
    imagePath?: string;
  }) {
    const {
      type,
      text,
      fontSize,
      x,
      y,
      width,
      height,
      dominantColor,
      imagePath,
    } = element;
    let description = "";

    if (type === "text") {
      description += `Text element "${text}" of font size ${fontSize}px`;
    } else if (type === "image") {
      description += `Image element with source "${imagePath}"`;
    }

    description += `, positioned at (${x}, ${y}) with dimensions of width ${width}px and height ${height}px`;

    if (dominantColor) {
      description += `, having a dominant color of rgb(${dominantColor.red}, ${dominantColor.green}, ${dominantColor.blue})`;
    }

    return description;
  }

  describeHierarchy(element: {
    type: any;
    text: any;
    fontSize: any;
    x: any;
    y: any;
    width: any;
    height: any;
    dominantColor: any;
    children?: any;
  }) {
    const description = [this.describeElement(element)];

    if (element.children.length) {
      const childrenDescriptions = element.children.map((child: any) =>
        this.describeHierarchy(child)
      );
      description.push("containing", ...childrenDescriptions);
    }

    return description.join(" ");
  }

  generateDescription(
    items: string | any[],
    start = 0,
    end = items.length - 1
  ) {
    if (start > end) return "";

    const currentItem = items[start];
    let description = ` at position (${currentItem.x}, ${currentItem.y}) with dimensions (${currentItem.width}, ${currentItem.height}) and a min-height of ${currentItem.height}px`;

    if (currentItem.color) description += ` with color "${currentItem.color}"`;
    if (currentItem.bgColor)
      description += ` with background-color "${currentItem.bgColor}"`;
    if (currentItem.text) description += ` containing "${currentItem.text}"`;

    const children = [];

    let lastContainedItemIndex = start;
    for (let i = start + 1; i <= end; i++) {
      const item = items[i];
      if (this.isWithin(item, currentItem)) {
        children.push(this.generateDescription(items, i, i));
        lastContainedItemIndex = i;
      }
    }

    if (children.length)
      description += " which contains: " + children.join("; ");
    description +=
      "; " + this.generateDescription(items, lastContainedItemIndex + 1, end);

    return description;
  }

  async enhanceDescription(visionOutput: any, originalImagePath: string) {
    // 1. Extract Elements
    const textRectangles = extractTextRectanglesFromAnnotations(
      visionOutput.textAnnotations
    );
    const imageRectangles = await this.extractImageRectanglesFromAnnotations(
      visionOutput.localizedObjectAnnotations,
      originalImagePath
    ); // Assuming a function like this exists
    // Combine text and image rectangles into one array
    const allItems = [...textRectangles, ...imageRectangles];

    // 2. Sort Elements
    allItems.sort((a, b) => {
      if (a.y === b.y) return a.x - b.x;
      return a.y - b.y;
    });

    // Generate the nested description
    const extractTagsFromVisionOutput = (visionOutput: any): string[] => {
      return visionOutput.labelAnnotations.map(
        (label: any) => label.description
      );
    };
    let description = this.generateDescription(
      allItems,
      0,
      allItems.length - 1
    );

    // Add additional details, like dominant colors, if required
    if (
      visionOutput.imagePropertiesAnnotation &&
      visionOutput.imagePropertiesAnnotation.dominantColors &&
      visionOutput.imagePropertiesAnnotation.dominantColors.colors
    ) {
      const dominantColors =
        visionOutput.imagePropertiesAnnotation.dominantColors.colors;
      description += `The dominant colors in the image are ${dominantColors
        .map(
          (color: { color: { red: any; green: any; blue: any } }) =>
            `rgb(${color.color.red}, ${color.color.green}, ${color.color.blue})`
        )
        .join(", ")}. `;
    }

    const tags = extractTagsFromVisionOutput(visionOutput);
    let tagDescription = `The webpage contains elements related to ${tags.join(
      ", "
    )}. `;
    description = `${tagDescription} ${description}`;

    return description;
  }

  async cropImage(
    originalImagePath: string,
    rectangle: { x: number; y: number; width: number; height: number },
    outputDirectory: string = ''
  ): Promise<string> {
    // Ensure valid rectangle dimensions
    // Load the image to get its dimensions
    const metadata = await sharp(originalImagePath).metadata();

    // Convert relative dimensions to actual pixel values
    const left = Math.round(rectangle.x * metadata.width!);
    const top = Math.round(rectangle.y * metadata.height!);
    const width = Math.round(rectangle.width * metadata.width!);
    const height = Math.round(rectangle.height * metadata.height!);


    if (top < 0 || left < 0 || width <= 0 || height <= 0) {
      return "";
    }

    const outputFilename = join(outputDirectory, `cropped_${Date.now()}.png`);
    console.log("Saving cropped image to", outputFilename);
    // Using sharp to crop the image
    await sharp(originalImagePath)
      .extract({
        left: Math.round(left),
        top: Math.round(top),
        width: Math.round(width),
        height: Math.round(height),
      })
      .toFile(outputFilename);

    return outputFilename;
  }

  async extractImageRectanglesFromAnnotations(
    localizedObjectAnnotations: any[],
    originalImagePath: string,
    outputDirectory?: string
  ): Promise<any[]> {

    const imageRectangles = [];
    for (const annotation of localizedObjectAnnotations) {
      if (
        annotation.boundingPoly &&
        annotation.boundingPoly.normalizedVertices &&
        annotation.boundingPoly.normalizedVertices[0]
      ) {
        const rectangle = {
          type: "image",
          x: annotation.boundingPoly.normalizedVertices[0].x,
          y: annotation.boundingPoly.normalizedVertices[0].y,
          width:
            annotation.boundingPoly.normalizedVertices[2].x -
            annotation.boundingPoly.normalizedVertices[0].x,
          height:
            annotation.boundingPoly.normalizedVertices[2].y -
            annotation.boundingPoly.normalizedVertices[0].y,
          imagePath: await this.cropImage(
            originalImagePath,
            {
              x: annotation.boundingPoly.normalizedVertices[0].x,
              y: annotation.boundingPoly.normalizedVertices[0].y,
              width:
                annotation.boundingPoly.normalizedVertices[2].x -
                annotation.boundingPoly.normalizedVertices[0].x,
              height:
                annotation.boundingPoly.normalizedVertices[2].y -
                annotation.boundingPoly.normalizedVertices[0].y,
            },
            outputDirectory
          ),
        };
        imageRectangles.push(rectangle);
      } else {
        continue;
      }
    }
    return imageRectangles;
  }
}

interface TextRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
}
