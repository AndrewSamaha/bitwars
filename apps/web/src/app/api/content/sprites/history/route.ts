import { readdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { readSpriteCandidateRequest } from "@/lib/content/spriteCandidates";

export const runtime = "nodejs";

const validEntityId = (value: string | null): value is string => Boolean(value && /^[a-z][a-z0-9_]*$/.test(value));
const validRequestId = (value: string) => /^[a-f0-9-]{36}$/.test(value);

export async function GET(request: Request) {
  const entityId = new URL(request.url).searchParams.get("entityId");
  if (!validEntityId(entityId)) return NextResponse.json({ error: "Choose a valid entity id." }, { status: 400 });
  const directory = path.resolve(process.cwd(), "../../packages/content/art-candidates", entityId);
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    const generations = await Promise.all(entries.filter((entry) => entry.isDirectory() && validRequestId(entry.name)).map(async (entry) => {
      const generation = await readSpriteCandidateRequest(entityId, entry.name);
      return { ...generation, candidates: generation.candidates.map((candidate) => ({ ...candidate, url: `/api/content/sprites/${entityId}/${entry.name}/${candidate.id}` })) };
    }));
    return NextResponse.json({ generations: generations.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return NextResponse.json({ generations: [] });
    return NextResponse.json({ error: "Unable to read sprite history." }, { status: 500 });
  }
}
