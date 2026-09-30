import sharp from "sharp";

const IMAGE_API = "https://api.openai.com/v1/images/edits";

export function generationSize(width: number, height: number) {
  const aspect = width / height;
  if (!Number.isFinite(aspect) || aspect < 1 / 3 || aspect > 3) throw new Error("Sprite aspect ratio must be between 1:3 and 3:1.");
  const scale = Math.sqrt(1_048_576 / (width * height));
  const outputWidth = Math.ceil(width * scale / 16) * 16;
  const outputHeight = Math.ceil(height * scale / 16) * 16;
  if (outputWidth > 3840 || outputHeight > 3840) throw new Error("Sprite is too narrow for image generation.");
  return `${outputWidth}x${outputHeight}`;
}

export async function editSpriteWithOpenAI(input: {
  image: Buffer;
  referenceImage?: Buffer;
  model: "gpt-image-2.5-flare" | "gpt-image-2.5-sunburst";
  prompt: string;
  size: string;
  quality: "medium" | "high";
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Set OPENAI_API_KEY on the server to generate player masks.");
  const form = new FormData();
  form.set("model", input.model);
  form.set("prompt", input.prompt);
  form.set("size", input.size);
  form.set("quality", input.quality);
  form.set("background", "transparent");
  form.set("output_format", "png");
  form.set("n", "1");
  form.set("image[]", new File([Uint8Array.from(input.image)], "sprite.png", { type: "image/png" }));
  if (input.referenceImage) {
    form.append("image[]", new File([Uint8Array.from(input.referenceImage)], "primary-mask.png", { type: "image/png" }));
  }

  const response = await fetch(IMAGE_API, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  const payload = await response.json() as { error?: { message?: string }; data?: Array<{ b64_json?: string }> };
  if (!response.ok) throw new Error(payload.error?.message ?? `OpenAI image editing failed (${response.status}).`);
  const encoded = payload.data?.[0]?.b64_json;
  if (!encoded) throw new Error("OpenAI returned no image.");
  const result = Buffer.from(encoded, "base64");
  const metadata = await sharp(result).metadata();
  if (metadata.format !== "png" || !metadata.width || !metadata.height) throw new Error("OpenAI returned an invalid PNG.");
  return result;
}

export const UPSCALE_PROMPT = [
  "Upscale this exact top-down game sprite as a clean, high-resolution reference for mask authoring.",
  "Keep the same entity, silhouette, orientation, centered placement, proportions, component positions, and transparent padding.",
  "Preserve its existing colors and drawn detail. Do not redesign, add parts, remove parts, rotate, crop, or add text.",
  "Output one isolated sprite on a genuinely transparent background, aligned to the input image canvas.",
].join(" ");

export function primaryMaskPrompt() {
  return [
    "Create a precise RGBA segmentation mask for this top-down game sprite, using its exact canvas and alignment.",
    "Select only 1 to 4 compact, distinctive features suitable for a player's PRIMARY color, such as a bridge, wing markings, or a few prominent armor panels. Aim to cover roughly 20-30% of the sprite's visible pixels.",
    "Favor features that remain recognizable at small game size. Do not select the entire hull, all panels of one material, scattered single pixels, outlines, shadows, or texture.",
    "Leave most of the visible sprite, including its main body and shading, unselected so its original artwork remains recognizable.",
    "Output the selected region as opaque white, with soft alpha only along its antialiased edges.",
    "Every unselected pixel, including the background, must be fully transparent.",
    "Do not draw or reproduce the sprite itself. Do not add shadows, borders, text, or a checkerboard.",
    "Keep the selected shapes within the original sprite silhouette and preserve their exact positions.",
  ].join(" ");
}
