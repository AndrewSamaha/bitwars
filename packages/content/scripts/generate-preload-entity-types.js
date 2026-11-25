#!/usr/bin/env node
/**
 * Reads packages/content/entities.yaml and generates preload-entity-types.ts
 * with PRELOAD_ENTITY_TYPES = list of entity_type_id keys. Run at build time
 * so the web app can import the list for texture preloading.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const YAML_PATH = path.join(ROOT, "entities.yaml");
const OUT_PATH = path.join(ROOT, "preload-entity-types.ts");

function extractEntityTypes(yamlContent) {
  const types = [];
  const lines = yamlContent.split(/\r?\n/);
  let inEntityTypes = false;
  let current;

  const finishCurrent = () => {
    if (!current) return;
    const definition = current.lines.map((line) => line.startsWith("    ") ? line.slice(4) : line).join("\n").trim();
    const referencesFor = (field) => {
      const block = definition.match(new RegExp(`^${field}:\\n((?: {2,}.*|\\s*)\\n)*`, "m"));
      return block ? [...block[0].matchAll(/^\s*-\s+entity_type_id:\s*([^\s#]+)/gm)].map((match) => match[1]) : [];
    };
    const visualBlock = definition.match(/^visual:\n((?: {2,}.*|\s*)\n)*/m)?.[0] ?? "";
    const visualNumber = (field) => Number(visualBlock.match(new RegExp(`^\\s*${field}:\\s*([^\\s#]+)`, "m"))?.[1]);
    const scale = visualNumber("scale");
    const rotateDeg = visualNumber("rotate_deg");
    types.push({
      id: current.id,
      builds: referencesFor("builds"),
      upgrades: referencesFor("upgrades"),
      visual: {
        ...(Number.isFinite(scale) ? { scale } : {}),
        ...(Number.isFinite(rotateDeg) ? { rotate_deg: rotateDeg } : {}),
      },
      definition,
    });
    current = undefined;
  };

  for (const line of lines) {
    if (/^entity_types\s*:/.test(line)) {
      inEntityTypes = true;
      continue;
    }
    if (!inEntityTypes) continue;
    // Top-level keys under entity_types are two spaces then key then colon
    const match = line.match(/^\s{2}([a-zA-Z_][a-zA-Z0-9_]*)\s*:/);
    if (match) {
      finishCurrent();
      current = { id: match[1], lines: [] };
    } else if (current && (line.match(/^\s{2,}/) || line.trim() === "" || line.startsWith("#"))) {
      current.lines.push(line);
    } else if (line.trim() === "" || line.startsWith("#")) {
      continue;
    } else {
      // less indent = we left entity_types
      break;
    }
  }
  finishCurrent();
  return types;
}

function indentOf(line) {
  return line.length - line.trimStart().length;
}

/** Column of a mapping key, accounting for the `- ` list marker. */
function keyIndentOf(line) {
  return indentOf(line) + (/^-\s+/.test(line.trimStart()) ? 2 : 0);
}

/** Match a mapping key whether or not it is the first key after `- `. */
function isKey(line, key) {
  return new RegExp(`^\\s*(?:-\\s+)?${key}:\\s*(?:#.*)?$`).test(line);
}

/** Split an entity definition into its `attacks:` list-item mapping blocks. */
function attackBlocks(definition) {
  const lines = definition.split(/\r?\n/);
  const attacksAt = lines.findIndex((line) => /^\s*attacks:\s*(?:#.*)?$/.test(line));
  if (attacksAt < 0) return [];
  const attacksIndent = indentOf(lines[attacksAt]);
  const blocks = [];
  let block;
  for (let i = attacksAt + 1; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      if (block) block.push(line);
      continue;
    }
    if (indentOf(line) <= attacksIndent) break;
    if (/^-\s+/.test(trimmed)) {
      if (block) blocks.push(block);
      block = [line];
    } else if (block) {
      block.push(line);
    }
  }
  if (block) blocks.push(block);
  return blocks;
}

/** Kinetic attacks author the projectile entity type once; export it for clients. */
function kineticProjectileTypeOf(definition) {
  const ids = [];
  for (const block of attackBlocks(definition)) {
    const typeLine = block.find((line) =>
      /^\s*(?:-\s+)?type:\s*kinetic\s*(?:#.*)?$/.test(line));
    if (!typeLine) continue;
    // Mapping order is not semantic, so locate `projectile:` anywhere in the
    // attack item instead of scanning forward from `type:`.
    const baseIndent = keyIndentOf(typeLine);
    const projectileAt = block.findIndex((line) =>
      keyIndentOf(line) === baseIndent && isKey(line, "projectile"));
    if (projectileAt < 0) {
      throw new Error("kinetic attack is missing a projectile mapping");
    }
    let found;
    for (let i = projectileAt + 1; i < block.length; i++) {
      const line = block[i];
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      if (keyIndentOf(line) <= baseIndent) break;
      const id = trimmed.match(/^entity_type_id:\s*([^\s#]+)/);
      if (id) {
        found = id[1];
        break;
      }
    }
    if (!found) {
      throw new Error("kinetic attack projectile is missing entity_type_id");
    }
    ids.push(found);
  }
  return ids;
}

function main() {
  const yamlContent = fs.readFileSync(YAML_PATH, "utf8");
  const types = extractEntityTypes(yamlContent);
  if (types.length === 0) {
    throw new Error("No entity_types found in entities.yaml");
  }
  const knownIds = new Set(types.map(({ id }) => id));
  for (const { id, builds, upgrades } of types) {
    for (const targetId of [...builds, ...upgrades]) {
      if (!knownIds.has(targetId)) {
        throw new Error(`${id} references unknown entity type ${targetId}`);
      }
    }
  }
  const ids = types.map(({ id }) => id);
  const kineticProjectileTypes = [...new Set(types.flatMap(({ definition }) =>
    kineticProjectileTypeOf(definition)))];
  if (kineticProjectileTypes.length === 0) {
    throw new Error("entities.yaml defines no kinetic attack with projectile.entity_type_id");
  }
  if (kineticProjectileTypes.length > 1) {
    throw new Error(`kinetic attacks reference multiple projectile entity types: ${kineticProjectileTypes.join(", ")}`);
  }
  const kineticProjectileType = kineticProjectileTypes[0];
  if (!knownIds.has(kineticProjectileType)) {
    throw new Error(`kinetic attacks reference unknown projectile entity type ${kineticProjectileType}`);
  }
  const tsContent = `// Generated by scripts/generate-preload-entity-types.js — do not edit by hand.
// Source: entities.yaml (entity_types keys).

export const PRELOAD_ENTITY_TYPES = ${JSON.stringify(ids)} as const;

/** Entity type spawned by kinetic attacks; authored once in entities.yaml. */
export const KINETIC_PROJECTILE_ENTITY_TYPE = ${JSON.stringify(kineticProjectileType)} as const;

export type PreloadEntityTypeId = (typeof PRELOAD_ENTITY_TYPES)[number];

/** Static content used by the content browser before a game server is running. */
export const ENTITY_CONTENT = ${JSON.stringify(types, null, 2)} as const;
`;

  fs.writeFileSync(OUT_PATH, tsContent, "utf8");
  console.log(`Wrote ${OUT_PATH} with types: ${ids.join(", ")}`);
}

if (require.main === module) main();

module.exports = { extractEntityTypes, kineticProjectileTypeOf };
