import { readFile, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { orientSprite, resizeSprite, type SpriteFront } from "@/lib/content/spriteProcessing";

const PUBLIC_ROOT = path.resolve(process.cwd(), "public/assets");
const CONTENT_ROOT = path.resolve(process.cwd(), "../../packages/content/assets");

export function spriteLibraryPath(relativePath: unknown): string {
  if (typeof relativePath !== "string" || !relativePath.endsWith(".png")) throw new Error("Choose a PNG sprite.");
  const segments = relativePath.split("/");
  if (segments.length < 2 || !segments.every((segment) => /^[a-zA-Z0-9_.-]+$/.test(segment) && segment !== "." && segment !== "..")) {
    throw new Error("Choose a valid sprite path.");
  }
  return path.resolve(PUBLIC_ROOT, ...segments);
}

async function existingPublicSpritePath(relativePath: string) {
  const filePath = spriteLibraryPath(relativePath);
  const resolvedPath = await realpath(filePath);
  const resolvedRoot = await realpath(PUBLIC_ROOT);
  if (!resolvedPath.startsWith(`${resolvedRoot}${path.sep}`)) throw new Error("Sprite path is outside the asset directory.");
  return resolvedPath;
}

export async function readLibrarySprite(relativePath: string): Promise<Buffer> {
  return readFile(await existingPublicSpritePath(relativePath));
}

export async function saveLibrarySprite(relativePath: string, image: Buffer) {
  const publicPath = await existingPublicSpritePath(relativePath);
  const contentPath = path.resolve(CONTENT_ROOT, relativePath);
  const resolvedContentPath = await realpath(contentPath).catch((error) => {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  });
  if (resolvedContentPath && !resolvedContentPath.startsWith(`${await realpath(CONTENT_ROOT)}${path.sep}`)) {
    throw new Error("Sprite path is outside the content asset directory.");
  }
  await Promise.all([writeFile(publicPath, image), ...(resolvedContentPath ? [writeFile(resolvedContentPath, image)] : [])]);
}

export async function transformLibrarySprite(image: Buffer, operation: { kind: "downsample"; size: 192 | 512 } | { kind: "rotate"; front: SpriteFront }) {
  return operation.kind === "downsample" ? resizeSprite(image, operation.size) : orientSprite(image, operation.front);
}
