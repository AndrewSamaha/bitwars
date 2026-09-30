import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import SpriteCatalog from "@/features/content/components/SpriteCatalog";
import { DEFAULT_PRIMARY_OPACITY, DEFAULT_SECONDARY_OPACITY, isPlayerColorOpacity } from "@/lib/playerColorSettings";

export const dynamic = "force-dynamic";

const ASSET_ROOT = path.join(process.cwd(), "public/assets");
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"]);

async function spritePaths(directory = ""): Promise<string[]> {
  const entries = await readdir(path.join(ASSET_ROOT, directory), { withFileTypes: true });
  const paths = await Promise.all(entries.map(async (entry) => {
    const relativePath = directory ? `${directory}/${entry.name}` : entry.name;
    if (entry.isDirectory()) return spritePaths(relativePath);
    return entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()) ? [relativePath] : [];
  }));
  return paths.flat();
}

export default async function SpriteLibraryPage({ searchParams }: { searchParams: Promise<{ sprite?: string; updated?: string }> }) {
  const [{ sprite, updated }, paths] = await Promise.all([searchParams, spritePaths()]);
  const pathSet = new Set(paths);
  const spritePathsOnly = paths.filter((relativePath) => !/\/(primary|secondary)\.png$/i.test(relativePath));
  const sprites = await Promise.all(spritePathsOnly.sort((a, b) => a.localeCompare(b)).map(async (relativePath) => {
    const metadata = await sharp(path.join(ASSET_ROOT, relativePath)).metadata().catch(() => null);
    const directory = path.posix.dirname(relativePath);
    const hasPlayerMasks = path.posix.basename(relativePath) === "idle.png"
      && pathSet.has(`${directory}/primary.png`);
    const settings = hasPlayerMasks
      ? await readFile(path.join(ASSET_ROOT, directory, "player-colors.json"), "utf8")
        .then((contents) => JSON.parse(contents) as { primaryOpacity?: unknown; secondaryOpacity?: unknown })
        .catch(() => null)
      : null;
    return {
      path: relativePath,
      width: metadata?.width ?? null,
      height: metadata?.height ?? null,
      hasPlayerMasks,
      primaryOpacity: isPlayerColorOpacity(settings?.primaryOpacity) ? settings.primaryOpacity : DEFAULT_PRIMARY_OPACITY,
      secondaryOpacity: isPlayerColorOpacity(settings?.secondaryOpacity) ? settings.secondaryOpacity : DEFAULT_SECONDARY_OPACITY,
    };
  }));
  return <SpriteCatalog assetVersion={updated} initialPath={sprite} sprites={sprites} />;
}
