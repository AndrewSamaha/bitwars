import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ENTITY_ID = /^[a-z][a-z0-9_]*$/;
const REQUEST_ID = /^[a-f0-9-]{36}$/;
const CANDIDATE_ID = /^candidate-[1-4]$/;

export type SpriteCandidateManifest = {
  entityId: string;
  requestId: string;
  createdAt: string;
  provider: "openai" | "qwen";
  prompt: string;
  finalPrompt: string;
  referenceEntityIds: string[];
  referenceStrength: "style" | "visual" | "close";
  resolution: 192 | 256 | 1024;
  steps: number;
  model: string;
  candidates: Array<{
    id: string;
    revisedPrompt?: string;
    seed?: number;
  }>;
};

function assertEntityId(entityId: string) {
  if (!ENTITY_ID.test(entityId)) throw new Error("Invalid entity id");
}

function assertRequestId(requestId: string) {
  if (!REQUEST_ID.test(requestId)) throw new Error("Invalid sprite request id");
}

function assertCandidateId(candidateId: string) {
  if (!CANDIDATE_ID.test(candidateId)) throw new Error("Invalid sprite candidate id");
}

export function spriteCandidateDirectory(entityId: string, requestId: string) {
  assertEntityId(entityId);
  assertRequestId(requestId);
  return path.resolve(process.cwd(), "../../packages/content/art-candidates", entityId, requestId);
}

export function spriteCandidatePath(entityId: string, requestId: string, candidateId: string) {
  assertCandidateId(candidateId);
  return path.join(spriteCandidateDirectory(entityId, requestId), `${candidateId}.png`);
}

export async function writeSpriteCandidateRequest(manifest: SpriteCandidateManifest, images: Buffer[]) {
  const directory = spriteCandidateDirectory(manifest.entityId, manifest.requestId);
  await mkdir(directory, { recursive: true });
  await Promise.all([
    writeFile(path.join(directory, "request.json"), `${JSON.stringify(manifest, null, 2)}\n`),
    ...images.map((image, index) => writeFile(path.join(directory, `candidate-${index + 1}.png`), image)),
  ]);
}

/** Creates a request manifest before its sequentially generated candidates arrive. */
export async function createSpriteCandidateRequest(manifest: SpriteCandidateManifest) {
  const directory = spriteCandidateDirectory(manifest.entityId, manifest.requestId);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, "request.json"), `${JSON.stringify(manifest, null, 2)}\n`);
}

/** Stores one candidate and advances the on-disk manifest for live review. */
export async function appendSpriteCandidate(manifest: SpriteCandidateManifest, image: Buffer) {
  const candidate = manifest.candidates.at(-1);
  if (!candidate) throw new Error("Cannot append a sprite without candidate metadata.");
  const directory = spriteCandidateDirectory(manifest.entityId, manifest.requestId);
  await Promise.all([
    writeFile(path.join(directory, `${candidate.id}.png`), image),
    writeFile(path.join(directory, "request.json"), `${JSON.stringify(manifest, null, 2)}\n`),
  ]);
}

export async function readSpriteCandidateRequest(entityId: string, requestId: string) {
  const raw = await readFile(path.join(spriteCandidateDirectory(entityId, requestId), "request.json"), "utf8");
  return JSON.parse(raw) as SpriteCandidateManifest;
}

export async function readSpriteCandidate(entityId: string, requestId: string, candidateId: string) {
  return readFile(spriteCandidatePath(entityId, requestId, candidateId));
}
