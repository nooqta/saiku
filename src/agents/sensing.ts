// src/agents/sensing.ts
// This module will handle gathering context about the environment.
import os from "os";
import process from "process";

export class SensingModule {
  constructor() {
    // Initialization logic if needed
  }

  async sense(): Promise<any> {
    // TODO: Expand context gathering (e.g., open files, terminal state)
    console.log("SensingModule.sense called");
    // Initial implementation based on the original Agent.sense
    return {
      agent: {
        name: "Saiku", // Or make this dynamic if needed
      },
      os: process.platform,
      arch: process.arch,
      version: process.version,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptime: process.uptime(),
      date: new Date().toLocaleDateString(),
      start_time: new Date().toLocaleTimeString(),
      cwd: process.cwd(),
      current_user: {
        name: process.env.ME,
        country: process.env.COUNTRY,
        city: process.env.CITY,
        company: process.env.COMPANY,
        phone: process.env.PHONE,
      },
      // Note: API services info might be better handled elsewhere or passed in
      // if it's needed by the LLM, rather than sensed directly here.
      // Consider removing this part or making it configurable.
      api_services: {
        weather: process.env.WEATHER_API_KEY,
        gitlab: (() => {
          const gitlab: any = {};
          for (const key in process.env) {
            if (key.startsWith("GITLAB_")) {
              gitlab[key.replace("GITLAB_", "")] = process.env[key];
            }
          }
          return gitlab;
        })(),
      },
    };
  }
}
