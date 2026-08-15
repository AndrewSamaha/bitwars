import { Application, type ApplicationOptions } from "pixi.js";

/**
 * Shared Pixi setup for Storybook labs. Match the game's high-DPI renderer
 * settings so a visual tuned in a story has the same canvas density on screen.
 */
export async function createPixiStoryApplication(options: Partial<ApplicationOptions>) {
  const app = new Application();
  await app.init({
    antialias: true,
    autoDensity: true,
    resolution: window.devicePixelRatio || 1,
    ...options,
  });
  return app;
}
