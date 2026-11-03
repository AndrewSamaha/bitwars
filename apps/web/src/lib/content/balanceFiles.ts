import { createHash, randomUUID } from "node:crypto";
import {
  link,
  mkdir,
  readdir,
  readFile,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { parseBalance } from "./balance";

// A fixed-length digest handles every public ID without path interpretation or
// filename length limits. Verify the embedded ID when reading an existing file.
export function balanceStore(
  directory = path.resolve(process.cwd(), "../../packages/content/balance"),
) {
  const filename = (id: string) =>
    path.join(
      directory,
      `${createHash("sha256").update(id).digest("hex")}.yaml`,
    );
  async function read(id: string) {
    const yaml = await readFile(filename(id), "utf8");
    if (parseBalance(yaml).id !== id)
      throw new Error("Stored visualization ID does not match");
    return yaml;
  }
  async function list() {
    await mkdir(directory, { recursive: true });
    return Promise.all(
      (await readdir(directory))
        .filter((file) => /^[a-f0-9]{64}\.yaml$/.test(file))
        .sort()
        .map(async (file) => {
          const yaml = await readFile(path.join(directory, file), "utf8");
          try {
            const config = parseBalance(yaml);
            return { id: config.id, name: config.name ?? config.id, yaml };
          } catch (error) {
            return {
              id: file,
              name: file,
              yaml,
              error: (error as Error).message,
            };
          }
        }),
    );
  }
  async function save(yaml: string, overwrite = false) {
    const config = parseBalance(yaml);
    await mkdir(directory, { recursive: true });
    const destination = filename(config.id);
    const temporary = `${destination}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, yaml, { flag: "wx" });
      if (overwrite) {
        // Check an existing file before replacing it; missing files are new saves.
        try {
          await read(config.id);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        }
        await rename(temporary, destination);
      } else await link(temporary, destination);
    } finally {
      await unlink(temporary).catch(() => {});
    }
    return config.id;
  }
  return { read, list, save };
}
