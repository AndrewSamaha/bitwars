import { Graphics, type Application, type Texture, Sprite } from "pixi.js";
import { SELECTED_COLOR } from "../styles/style";

const HEALTH_ARC_RADIUS = 170;
const HEALTH_ARC_START = Math.PI * 1.12;
const HEALTH_ARC_END = Math.PI * 1.88;
const BUILD_ARC_RADIUS = 190;

function healthColor(healthFraction: number): number {
  if (healthFraction > 0.6) return 0x58_d6_72;
  if (healthFraction > 0.3) return 0xff_c8_3d;
  return 0xff_5b_52;
}

export function createHoverIndicator() {
  const hoverIndicator = new Graphics()
    .fill(SELECTED_COLOR)
    .circle(0, 0, 150)
    .stroke(SELECTED_COLOR);
  hoverIndicator.label = 'hoverIndicator';
  return hoverIndicator;
}

/** Draw a top semicircle health meter in the hovered entity's local space. */
export function drawHealthArc(graphics: Graphics, health: number, maxHealth: number) {
  const fraction = maxHealth > 0 ? Math.min(1, Math.max(0, health / maxHealth)) : 0;
  graphics.clear();
  graphics.arc(0, 0, HEALTH_ARC_RADIUS, HEALTH_ARC_START, HEALTH_ARC_END).stroke({
    width: 11,
    color: 0x10_14_1c,
    alpha: 0.8,
  });
  if (fraction > 0) {
    const filledSweep = (HEALTH_ARC_END - HEALTH_ARC_START) * fraction;
    const filledStart = (HEALTH_ARC_START + HEALTH_ARC_END) / 2 - filledSweep / 2;
    graphics
      .arc(0, 0, HEALTH_ARC_RADIUS, filledStart, filledStart + filledSweep)
      .stroke({
        width: 7,
        color: healthColor(fraction),
        alpha: 0.98,
      });
  }
}

/** Draw a clockwise build-progress ring outside the health meter. */
export function drawBuildArc(graphics: Graphics, progress: number) {
  const fraction = Math.min(1, Math.max(0, progress));
  graphics.clear();
  if (fraction === 1) {
    graphics.circle(0, 0, BUILD_ARC_RADIUS).stroke({ width: 7, color: 0x44_aa_ff, alpha: 0.98 });
  } else if (fraction > 0) {
    graphics.arc(0, 0, BUILD_ARC_RADIUS, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fraction).stroke({
      width: 7,
      color: 0x44_aa_ff,
      alpha: 0.98,
    });
  }
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
