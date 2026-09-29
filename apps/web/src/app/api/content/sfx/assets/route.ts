import { mkdir, open, realpath } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { validSfxId } from "@/features/audio/sfxCatalog";

export const runtime = "nodejs";

const SFX_ROOT = path.resolve(process.cwd(), "public/audio/sfx");
const MAX_BYTES = 10 * 1024 * 1024;
const VALID_NAME = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,120}\.(?:mp3|wav|ogg|flac)$/i;

function validAudioBytes(name: string, bytes: Buffer) {
  const extension = path.extname(name).toLowerCase();
  if (extension === ".flac") return bytes.subarray(0, 4).toString() === "fLaC";
  if (extension === ".ogg") return bytes.subarray(0, 4).toString() === "OggS";
  if (extension === ".wav") return bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WAVE";
  if (extension === ".mp3") return bytes.subarray(0, 3).toString() === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
  return false;
}

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const id = data.get("id");
    const file = data.get("file");
    if (!validSfxId(id) || !(file instanceof File) || !VALID_NAME.test(file.name)) throw new Error("Choose an MP3, WAV, OGG, or FLAC file with a simple filename.");
    if (!file.size || file.size > MAX_BYTES) throw new Error("Audio file must be between 1 byte and 10 MiB.");
    const bytes = Buffer.from(await file.arrayBuffer());
    if (!validAudioBytes(file.name, bytes)) throw new Error("File contents do not match the selected audio format.");
    const root = await realpath(SFX_ROOT);
    const directory = path.join(root, id);
    await mkdir(directory, { recursive: true });
    const resolvedDirectory = await realpath(directory);
    if (!resolvedDirectory.startsWith(`${root}${path.sep}`)) throw new Error("Invalid audio destination.");
    const destination = path.join(resolvedDirectory, file.name);
    const handle = await open(destination, "wx");
    try { await handle.writeFile(bytes); } finally { await handle.close(); }
    return NextResponse.json({ source: `sfx/${id}/${file.name}` });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to upload audio." }, { status: 400 });
  }
}
