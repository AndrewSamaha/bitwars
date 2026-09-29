import { NextResponse } from "next/server";
import { GAMEPLAY_SOUND_EFFECTS, validSfxId, validateSfxDefinition } from "@/features/audio/sfxCatalog";
import { readSfxCatalog, saveSfxCatalog, sfxEntries } from "@/lib/content/sfxCatalogFile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
  return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update SFX catalog." }, { status: 400 });
}

export async function GET() {
  try {
    const { definitions } = await readSfxCatalog();
    return NextResponse.json({ effects: sfxEntries(definitions) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { id, definition } = await request.json();
    if (!validSfxId(id)) throw new Error("Use a lowercase, hyphenated sound key.");
    const { document, definitions } = await readSfxCatalog();
    if (definitions[id]) throw new Error("That sound key already exists.");
    document.setIn(["sound_effects", id], validateSfxDefinition(definition));
    return NextResponse.json({ effects: await saveSfxCatalog(document) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const { id, definition } = await request.json();
    if (!validSfxId(id)) throw new Error("Choose a valid sound key.");
    const { document, definitions } = await readSfxCatalog();
    if (!definitions[id]) throw new Error("Sound effect not found.");
    document.setIn(["sound_effects", id], validateSfxDefinition(definition));
    return NextResponse.json({ effects: await saveSfxCatalog(document) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!validSfxId(id)) throw new Error("Choose a valid sound key.");
    if (GAMEPLAY_SOUND_EFFECTS.includes(id as typeof GAMEPLAY_SOUND_EFFECTS[number])) throw new Error("This sound is used by gameplay and cannot be deleted.");
    const { document, definitions } = await readSfxCatalog();
    if (!definitions[id]) throw new Error("Sound effect not found.");
    document.deleteIn(["sound_effects", id]);
    return NextResponse.json({ effects: await saveSfxCatalog(document) });
  } catch (error) {
    return errorResponse(error);
  }
}
