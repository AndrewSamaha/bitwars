import { randomInt, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { appendSpriteCandidate, createSpriteCandidateRequest, type SpriteCandidateManifest } from "@/lib/content/spriteCandidates";

export const runtime = "nodejs";

const validEntityId = (value: unknown): value is string => typeof value === "string" && /^[a-z][a-z0-9_]*$/.test(value);
const providers = ["openai", "qwen"] as const;
type Provider = (typeof providers)[number];
const referenceStrengths = ["style", "visual", "close"] as const;
type ReferenceStrength = (typeof referenceStrengths)[number];
const MAX_REFERENCES = 3;
const MAX_CANDIDATES = 4;
const qwenResolutions = [192, 256, 1024] as const;
type QwenResolution = (typeof qwenResolutions)[number];

type ImageResult = { b64_json?: string; image?: string; image_base64?: string; revised_prompt?: string };
type ImageResponse = { error?: { message?: string } | string; detail?: unknown; data?: ImageResult[]; images?: Array<ImageResult | string>; image?: string; image_base64?: string };
type GeneratedImage = { image: string; revisedPrompt?: string };

function buildPrompt(brief: string, referenceEntityIds: string[], referenceStrength: ReferenceStrength) {
  const referenceDirection = {
    style: "The selected BitWars entities are style cues only. Create a clearly distinct design; prioritize a new silhouette, structure, and component arrangement.",
    visual: "The attached BitWars sprites are visual references. Preserve their broad art direction, but create a distinct entity with a different silhouette and component arrangement.",
    close: "The attached BitWars sprites are close visual references. Preserve their art direction and visual language while creating an original entity for this brief.",
  }[referenceStrength];
  return [
    "Create one original BitWars RTS game sprite.",
    "It must be a single centered, top-down game entity, with a transparent background and no text, borders, UI, or scene.",
    "Keep the silhouette readable when displayed small.",
    referenceDirection,
    `Art brief: ${brief.trim()}`,
    referenceEntityIds.length ? `Style reference entity IDs: ${referenceEntityIds.join(", ")}.` : "",
  ].filter(Boolean).join("\n\n");
}

async function referenceImage(entityId: string) {
  const image = await readFile(path.resolve(process.cwd(), "public/assets", entityId, "idle.png"));
  return new File([Uint8Array.from(image)], `${entityId}.png`, { type: "image/png" });
}

function base64Images(payload: ImageResponse) {
  return [
    ...(payload.data ?? []),
    ...(payload.images ?? []),
    payload.image ? { image: payload.image } : undefined,
    payload.image_base64 ? { image_base64: payload.image_base64 } : undefined,
  ].flatMap((item) => {
    const value = typeof item === "string" ? item : item?.b64_json ?? item?.image ?? item?.image_base64;
    return value ? [value.startsWith("data:") ? value.slice(value.indexOf(",") + 1) : value] : [];
  });
}

async function readImageResponse(response: Response): Promise<GeneratedImage> {
  const payload = await response.json() as ImageResponse;
  if (!response.ok) {
    const detail = typeof payload.error === "string" ? payload.error : payload.error?.message;
    throw new Error(detail ?? (typeof payload.detail === "string" ? payload.detail : "Image generation failed."));
  }
  const image = base64Images(payload)[0];
  if (!image) throw new Error("The image provider returned no usable PNG candidate.");
  return { image, revisedPrompt: payload.data?.[0]?.revised_prompt };
}

async function generateOneWithOpenAi(input: { brief: string; referenceEntityIds: string[]; referenceStrength: ReferenceStrength }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Set OPENAI_API_KEY on the server to generate OpenAI sprites.");
  const model = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2.5-flare";
  const prompt = buildPrompt(input.brief, input.referenceEntityIds, input.referenceStrength);
  const hasReferences = input.referenceEntityIds.length > 0 && input.referenceStrength !== "style";
  const requestBody = hasReferences
    ? await (async () => {
      const form = new FormData();
      form.set("model", model);
      form.set("prompt", prompt);
      form.set("n", "1");
      form.set("size", "1024x1024");
      form.set("quality", "medium");
      form.set("background", "transparent");
      form.set("output_format", "png");
      for (const referenceId of input.referenceEntityIds) form.append("image[]", await referenceImage(referenceId));
      return form;
    })()
    : JSON.stringify({ model, prompt, n: 1, size: "1024x1024", quality: "medium", background: "transparent", output_format: "png" });
  const response = await fetch(hasReferences ? "https://api.openai.com/v1/images/edits" : "https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, ...(typeof requestBody === "string" ? { "Content-Type": "application/json" } : {}) },
    body: requestBody,
  });
  return readImageResponse(response);
}

async function generateOneWithQwen(input: { brief: string; referenceEntityIds: string[]; referenceStrength: ReferenceStrength; resolution: QwenResolution; steps: number; seed: number }) {
  const endpoint = (process.env.QWEN_IMAGE_API_URL ?? "http://192.168.1.11:8091").replace(/\/$/, "");
  const form = new FormData();
  form.set("prompt", buildPrompt(input.brief, input.referenceEntityIds, input.referenceStrength));
  form.set("width", String(input.resolution));
  form.set("height", String(input.resolution));
  form.set("steps", String(input.steps));
  form.set("seed", String(input.seed));
  if (input.referenceStrength !== "style") {
    for (const referenceId of input.referenceEntityIds) form.append("images", await referenceImage(referenceId));
  }
  return readImageResponse(await fetch(`${endpoint}/v1/images/generations`, { method: "POST", body: form }));
}

function streamEvent(controller: ReadableStreamDefaultController<Uint8Array>, value: unknown) {
  controller.enqueue(new TextEncoder().encode(`${JSON.stringify(value)}\n`));
}

export async function POST(request: Request) {
  const body = await request.json();
  const entityId = body?.entityId;
  const brief = body?.brief;
  const referenceEntityIds = Array.isArray(body?.referenceEntityIds) ? [...new Set(body.referenceEntityIds)] : [];
  const count = body?.count ?? 4;
  const provider = body?.provider ?? "openai";
  const referenceStrength = body?.referenceStrength ?? "style";
  const resolution = body?.resolution ?? 256;
  const steps = body?.steps ?? 40;

  if (!validEntityId(entityId)) return NextResponse.json({ error: "Choose a valid entity id." }, { status: 400 });
  if (typeof brief !== "string" || brief.trim().length < 12 || brief.length > 2_000) return NextResponse.json({ error: "Art brief must be between 12 and 2,000 characters." }, { status: 400 });
  if (referenceEntityIds.length > MAX_REFERENCES || !referenceEntityIds.every(validEntityId)) return NextResponse.json({ error: `Choose up to ${MAX_REFERENCES} valid style references.` }, { status: 400 });
  if (!Number.isInteger(count) || count < 1 || count > MAX_CANDIDATES) return NextResponse.json({ error: `Candidate count must be between 1 and ${MAX_CANDIDATES}.` }, { status: 400 });
  if (!providers.includes(provider)) return NextResponse.json({ error: "Choose a supported image provider." }, { status: 400 });
  if (!referenceStrengths.includes(referenceStrength)) return NextResponse.json({ error: "Choose a supported reference strength." }, { status: 400 });
  if (!qwenResolutions.includes(resolution)) return NextResponse.json({ error: "Choose a supported Qwen resolution." }, { status: 400 });
  if (!Number.isInteger(steps) || steps < 1 || steps > 100) return NextResponse.json({ error: "Qwen steps must be a whole number between 1 and 100." }, { status: 400 });

  const requestId = randomUUID();
  const finalPrompt = buildPrompt(brief, referenceEntityIds, referenceStrength as ReferenceStrength);
  const manifest: SpriteCandidateManifest = {
    entityId,
    requestId,
    createdAt: new Date().toISOString(),
    provider: provider as Provider,
    prompt: brief.trim(),
    finalPrompt,
    referenceEntityIds,
    referenceStrength: referenceStrength as ReferenceStrength,
    resolution: provider === "qwen" ? resolution as QwenResolution : 1024,
    steps: provider === "qwen" ? steps : 0,
    model: provider === "openai" ? process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2.5-flare" : "qwen-image-2.1",
    candidates: [],
  };
  await createSpriteCandidateRequest(manifest);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      streamEvent(controller, { type: "start", entityId, requestId, count, provider, finalPrompt });
      try {
        for (let index = 0; index < count; index += 1) {
          const seed = provider === "qwen" ? randomInt(1, 2_147_483_647) : undefined;
          const generated = await (provider === "openai"
            ? generateOneWithOpenAi({ brief, referenceEntityIds, referenceStrength })
            : generateOneWithQwen({ brief, referenceEntityIds, referenceStrength, resolution: resolution as QwenResolution, steps, seed: seed! }));
          const candidate = { id: `candidate-${index + 1}`, revisedPrompt: generated.revisedPrompt, seed };
          manifest.candidates.push(candidate);
          await appendSpriteCandidate(manifest, Buffer.from(generated.image, "base64"));
          streamEvent(controller, { type: "candidate", candidate: { ...candidate, url: `/api/content/sprites/${entityId}/${requestId}/${candidate.id}` } });
        }
        streamEvent(controller, { type: "done" });
      } catch (error) {
        console.error("Sprite generation failed", error);
        streamEvent(controller, { type: "error", error: error instanceof Error ? error.message : "Sprite generation failed." });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store" } });
}
