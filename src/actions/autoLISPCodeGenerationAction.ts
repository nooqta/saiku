import { Action } from '../interfaces/action';
import AutoLISPCodeGenerationPromptAction from './autoLISPCodeGenerationromptAction';

class AutoLISPCodeGenerationAction implements Action {
  name = 'generate_autolisp_code';
  description = 'Generate AutoLISP code for architectural tasks';
  arguments = [];

  async run(): Promise<any> {
    // Use the prompt action to gather information
    const promptAction = new AutoLISPCodeGenerationPromptAction();
    const userInput = await promptAction.run();

    // Extract information from userInput
    const {
      roomLayout,
      roomLabels,
      coordinateSystem,
      labelStyles,
      scalingAndUnits,
    } = userInput;

    // Generate AutoLISP code based on gathered information
    const generatedCode = this.generateAutoLISPCode(
      roomLayout,
      roomLabels,
      coordinateSystem,
      labelStyles,
      scalingAndUnits
    );

    // You can return the generated code or perform any additional actions here
    return { message: 'AutoLISP code successfully generated.', code: generatedCode };
  }

  private generateAutoLISPCode(
    roomLayout: string,
    roomLabels: string,
    coordinateSystem: string,
    labelStyles: string,
    scalingAndUnits: string
  ): string {
    // Implement your AutoLISP code generation logic here
    // Use the provided input data to generate the code
    const generatedCode = `
      ; AutoLISP code generated based on user input
      (setq roomLayout "${roomLayout}")
      (setq roomLabels "${roomLabels}")
      (setq coordinateSystem "${coordinateSystem}")
      (setq labelStyles "${labelStyles}")
      (setq scalingAndUnits "${scalingAndUnits}")
      ; Your AutoLISP code continues here...
    `;

    return generatedCode;
  }
}

export default AutoLISPCodeGenerationAction;
