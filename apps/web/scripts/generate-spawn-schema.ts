import { writeFileSync } from "node:fs";
import { spawnJsonSchema } from "../src/lib/content/spawnConfig";

// Cross-field and content checks still run through parseSpawnConfig when saving.
const schema = spawnJsonSchema();
writeFileSync(new URL("../src/lib/content/spawn.schema.json", import.meta.url), `${JSON.stringify(schema, null, 2)}\n`);
