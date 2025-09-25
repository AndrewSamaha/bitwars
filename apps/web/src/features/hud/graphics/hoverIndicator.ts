import { Graphics, type Application, type Texture, Sprite } from "pixi.js";
import { SELECTED_COLOR } from "../styles/style";

export function createHoverIndicator() {
  const hoverIndicator = new Graphics()
    .fill(SELECTED_COLOR)
    .circle(0, 0, 150)
    .stroke(SELECTED_COLOR);
  hoverIndicator.label = 'hoverIndicator';
  return hoverIndicator;
}

export function createHoverIndicatorTexture(app: Application) {
  const hoverIndicator = createHoverIndicator();
  const texture = app.renderer.generateTexture(hoverIndicator);
  hoverIndicator.destroy();
  return texture;
}

export function createHoverIndicatorSprite(texture: Texture) {
  const sprite = new Sprite(texture);
  sprite.label='hoverIndicator';
  sprite.anchor.set(0.5);
  sprite.visible = false;
  return sprite;
}
