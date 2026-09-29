import { readFile, realpath, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseDocument, type Document } from "yaml";
import { GAMEPLAY_SOUND_EFFECTS, type SfxDefinition, type SfxEntry, validSfxId, validateSfxDefinition } from "@/features/audio/sfxCatalog";

const CATALOG_PATH = path.resolve(process.cwd(), "../../packages/content/sfx.yaml");
const AUDIO_ROOT = path.resolve(process.cwd(), "public/audio");
const ATTRIBUTIONS_PATH = path.join(AUDIO_ROOT, "ATTRIBUTIONS.md");

function definitionsFromDocument(document: Document.Parsed): Record<string, SfxDefinition> {
  if (document.errors.length) throw new Error("The SFX catalog contains invalid YAML.");
  const root = document.toJS();
  const entries = root?.sound_effects;
  if (!entries || typeof entries !== "object" || Array.isArray(entries)) throw new Error("The SFX catalog needs a sound_effects map.");
  const definitions: Record<string, SfxDefinition> = {};
  for (const [id, value] of Object.entries(entries)) {
    if (!validSfxId(id)) throw new Error(`Invalid sound effect key: ${id}`);
    definitions[id] = validateSfxDefinition(value);
  }
  for (const id of GAMEPLAY_SOUND_EFFECTS) if (!definitions[id]?.sources.length) throw new Error(`Gameplay sound ${id} needs at least one file.`);
  return definitions;
}

export async function readSfxCatalog() {
  const document = parseDocument(await readFile(CATALOG_PATH, "utf8"));
  const definitions = definitionsFromDocument(document);
  return { document, definitions };
}

export function sfxEntries(definitions: Record<string, SfxDefinition>): SfxEntry[] {
  return Object.entries(definitions).map(([id, definition]) => ({ id, definition, usedByGameplay: GAMEPLAY_SOUND_EFFECTS.includes(id as typeof GAMEPLAY_SOUND_EFFECTS[number]) }));
}

export async function validateSfxFiles(definitions: Record<string, SfxDefinition>) {
  const root = await realpath(AUDIO_ROOT);
  for (const [id, definition] of Object.entries(definitions)) {
    for (const source of definition.sources) {
      const filePath = path.resolve(root, source);
      const actualPath = await realpath(filePath).catch(() => { throw new Error(`Missing audio file for ${id}: ${source}`); });
      if (!actualPath.startsWith(`${root}${path.sep}`) || !(await stat(actualPath)).isFile()) throw new Error(`Invalid audio file for ${id}: ${source}`);
    }
  }
}

function escapeMarkdown(text: string) {
  return text.replaceAll("\n", " ").replaceAll("\r", " ");
}

async function updateAttributions(definitions: Record<string, SfxDefinition>) {
  const previous = await readFile(ATTRIBUTIONS_PATH, "utf8");
  const startMarker = "<!-- BEGIN GENERATED SFX -->";
  const endMarker = "<!-- END GENERATED SFX -->";
  const startIndex = previous.indexOf(startMarker);
  const endIndex = previous.indexOf(endMarker);
  if (startIndex < 0 || endIndex < startIndex) throw new Error("Audio attribution file is missing its generated SFX markers.");
  const sections = Object.values(definitions).filter(({ sources }) => sources.length > 0).map(({ name, sources, attribution }) => {
    const files = sources.map((source) => `\`${source}\``).join(", ");
    return `### ${escapeMarkdown(name)}\n\n- Files: ${files}\n- Artist: ${escapeMarkdown(attribution.artist)}\n- Source: ${escapeMarkdown(attribution.source)}\n- License: ${escapeMarkdown(attribution.license)}\n- Changes: ${escapeMarkdown(attribution.changes)}\n- Retrieved: ${escapeMarkdown(attribution.retrieved)}`;
  });
  await writeFile(ATTRIBUTIONS_PATH, `${previous.slice(0, startIndex + startMarker.length)}\n\n${sections.join("\n\n")}\n\n${previous.slice(endIndex)}`);
}

export async function saveSfxCatalog(document: Document.Parsed) {
  const definitions = definitionsFromDocument(document);
  await validateSfxFiles(definitions);
  await updateAttributions(definitions);
  await writeFile(CATALOG_PATH, String(document));
  return sfxEntries(definitions);
}
