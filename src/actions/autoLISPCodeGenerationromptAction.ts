import { Action } from '../interfaces/action';
import { prompt } from 'prompts';

export default class AutoLISPCodeGenerationPromptAction implements Action {
  name = 'autolisp_code_generation_prompt';
  description = 'Prompt the user for information needed to generate AutoLISP code.';
  arguments = [];

  async run(): Promise<any> {
    const projectScope = await this.promptText('What is the project\'s scope and purpose? Are there any specific goals or objectives you want to achieve with this AutoLISP code?');
    const cadSoftwareVersion = await this.promptText('Which CAD software and version are you using (e.g., AutoCAD 2023)? It\'s important to know the CAD environment to ensure compatibility.');
    const inputData = await this.promptText('What is the source of the data for the floor plans? Do you have existing CAD drawings, sketches, or other formats?');
    const roomLayout = await this.promptText('How should the rooms be represented? Are they simple polygons (rectangles) or irregular shapes?');
    const roomLabels = await this.promptText('What information should be included in the room labels? For example, room names, dimensions, areas, or other custom data.');
    const coordinateSystem = await this.promptText('What coordinate system or reference point should be used for placing the rooms and labels? Is there a specific origin point or coordinate layout?');
    const dataFormat = await this.promptText('How is the room and label data currently structured or stored? Is it in a spreadsheet, database, or another format?');
    const labelStyles = await this.promptText('Do you have any specific preferences for the style and formatting of the labels? Font type, size, color, etc.');
    const scalingAndUnits = await this.promptText('What scale should be applied to the floor plans, and what units of measurement (e.g., inches, feet, meters) should be used?');
    const automationTriggers = await this.promptText('Should the AutoLISP code be triggered manually, or do you want it to automatically run when specific conditions are met?');
    const qualityControl = await this.promptText('Do you have any requirements for validating the generated floor plans to ensure accuracy?');
    const outputRequirements = await this.promptText('How would you like the generated floor plans to be saved or presented? (e.g., DWG files, PDFs, printed copies)');
    const testingAndRevisions = await this.promptText('Are you open to iterative testing and revisions of the AutoLISP code to fine-tune its performance?');
    const deadlineAndBudget = await this.promptText('What is the project timeline, and do you have any budget constraints or expectations?');
    const additionalFeatures = await this.promptText('Are there any additional features or functionalities you would like to include in the AutoLISP code, such as generating reports or exporting data?');
    const dataSecurity = await this.promptText('How should sensitive data be handled and secured within the AutoLISP code?');

    // Now you have all the user's responses, and you can use this information to generate AutoLISP code or perform other actions as needed.
    // You can replace the following console.log statements with your code generation logic.

    console.log('Project Scope:', projectScope);
    console.log('CAD Software Version:', cadSoftwareVersion);
    console.log('Input Data:', inputData);
    console.log('Room Layout:', roomLayout);
    console.log('Room Labels:', roomLabels);
    console.log('Coordinate System:', coordinateSystem);
    console.log('Data Format:', dataFormat);
    console.log('Label Styles:', labelStyles);
    console.log('Scaling and Units:', scalingAndUnits);
    console.log('Automation Triggers:', automationTriggers);
    console.log('Quality Control:', qualityControl);
    console.log('Output Requirements:', outputRequirements);
    console.log('Testing and Revisions:', testingAndRevisions);
    console.log('Deadline and Budget:', deadlineAndBudget);
    console.log('Additional Features:', additionalFeatures);
    console.log('Data Security:', dataSecurity);

    // You can return the gathered data as an object if needed.
    return {
      projectScope,
      cadSoftwareVersion,
      inputData,
      roomLayout,
      roomLabels,
      coordinateSystem,
      dataFormat,
      labelStyles,
      scalingAndUnits,
      automationTriggers,
      qualityControl,
      outputRequirements,
      testingAndRevisions,
      deadlineAndBudget,
      additionalFeatures,
      dataSecurity,
    };
  }

  private async promptText(question: string): Promise<string> {
    const response = await prompt({
      type: 'text',
      name: 'answer',
      message: question,
    });

    return response.answer;
  }
}
