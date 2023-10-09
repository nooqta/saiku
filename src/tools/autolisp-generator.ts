type Point = [number, number];

type BuildingSpecs = {
    base: { width: number, length: number, height: number },
    roof: { type: string, pitch: number },
    door: { width: number, height: number, position: string },
    window: { width: number, height: number, position: string, quantity: number },
    [key: string]: any, // allow any other sections in the text file
    // ... any other sections you have in your text file

};

export class AutoLISPGenerator {
    generateAutoLISP(buildingSpecs: BuildingSpecs): string {
        let code = `(defun c:DrawBuilding (/)\n`;

        // Base
        const base = buildingSpecs.base;
        code += this.drawRect([0, 0], base.width, base.length, "Base");

        // Roof
        const roof = buildingSpecs.roof;
        if (roof.type.toLowerCase() === "gable") {
            code += this.drawGableRoof([0, 0], base.width, base.length, roof.pitch);
        }

        // Door
        const door = buildingSpecs.door;
        code += this.drawRect([base.width / 2 - door.width / 2, 0], door.width, door.height, "Door");

        // Windows
        const window = buildingSpecs.window;
        for (let i = 0; i < window.quantity; i++) {
            const xPos = i % 2 === 0 ? base.width / 4 - window.width / 2 : 3 * base.width / 4 - window.width / 2;
            code += this.drawRect([xPos, base.height / 2 - window.height / 2], window.width, window.height, `Window${i + 1}`);
        }

        code += `)\n`;
        console.log(code);
        return code;
    }

    drawRect(start: Point, width: number, length: number, layer: string): string {
        return `
    (command "._rectangle" (strcat (rtos (car ${start}) 2 2) "," (rtos (cadr ${start}) 2 2)) 
                           (strcat (rtos (+ (car ${start}) ${width}) 2 2) "," (rtos (+ (cadr ${start}) ${length}) 2 2)) 
                           "L" "${layer}")`;
    }

    drawGableRoof(start: Point, width: number, length: number, pitch: number): string {
        const midX = (start[0] + width) / 2;
        const midY = start[1] + length + pitch;
        return `
    (command "._pline"
             (strcat (rtos ${start[0]} 2 2) "," (rtos (+ ${start[1]} ${length}) 2 2)) 
             (strcat (rtos ${midX} 2 2) "," (rtos ${midY} 2 2)) 
             (strcat (rtos (+ ${start[0]} ${width}) 2 2) "," (rtos (+ ${start[1]} ${length}) 2 2)) 
             "c")`;
    }
}
