import { secondaryCoverageAlpha } from "./playerColorSettings";

async function loadImage(url: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = url;
  await image.decode();
  return image;
}

/** Build color-only masks from the published sprite and its primary selection. */
export async function playerColorMaskCanvases(baseUrl: string, primaryUrl: string) {
  const [baseImage, primaryImage] = await Promise.all([loadImage(baseUrl), loadImage(primaryUrl)]);
  const width = baseImage.naturalWidth;
  const height = baseImage.naturalHeight;
  if (primaryImage.naturalWidth !== width || primaryImage.naturalHeight !== height) {
    throw new Error("The primary mask must match the sprite dimensions.");
  }

  function pixelsFor(image: HTMLImageElement) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Unable to read player color mask pixels.");
    context.drawImage(image, 0, 0);
    return { canvas, context, pixels: context.getImageData(0, 0, width, height) };
  }

  const base = pixelsFor(baseImage);
  const primary = pixelsFor(primaryImage);
  const secondary = pixelsFor(baseImage);
  for (let index = 0; index < primary.pixels.data.length; index += 4) {
    const primaryAlpha = Math.min(base.pixels.data[index + 3]!, primary.pixels.data[index + 3]!);
    secondary.pixels.data[index + 3] = secondaryCoverageAlpha(base.pixels.data[index + 3]!, primaryAlpha);
    primary.pixels.data[index] = secondary.pixels.data[index] = 255;
    primary.pixels.data[index + 1] = secondary.pixels.data[index + 1] = 255;
    primary.pixels.data[index + 2] = secondary.pixels.data[index + 2] = 255;
    primary.pixels.data[index + 3] = primaryAlpha;
  }
  primary.context.putImageData(primary.pixels, 0, 0);
  secondary.context.putImageData(secondary.pixels, 0, 0);
  return { primary: primary.canvas, secondary: secondary.canvas };
}
