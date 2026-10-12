import { createHash } from "node:crypto";
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type PlayerChange = {
  cursor: number;
  run_id: string;
  tick?: number | string;
  kind: "entity_created" | "entity_removed" | "collector_state" | "command_submitted" | "lifecycle" | "resync" | "world_reset";
  received_at_ms: number;
  data: Record<string, unknown>;
};

/** A small, append-only history of meaningful player-visible changes. */
export class ObservationJournal {
  private readonly file: string;
  private readonly records: PlayerChange[];
  readonly recoveredIncompleteRow: boolean;

  constructor(directory: string, username: string, runId: string) {
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    const key = createHash("sha256").update(`${username}\0${runId}`).digest("hex");
    this.file = join(directory, `${key}.jsonl`);
    let contents = "";
    try { contents = readFileSync(this.file, "utf8"); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    // A process can stop halfway through its final append. Keep complete rows.
    this.recoveredIncompleteRow = Boolean(contents && !contents.endsWith("\n"));
    if (this.recoveredIncompleteRow) {
      contents = contents.slice(0, contents.lastIndexOf("\n") + 1);
      writeFileSync(this.file, contents, { mode: 0o600 });
    }
    this.records = contents.trim() ? contents.trimEnd().split("\n").map(line => JSON.parse(line) as PlayerChange) : [];
    if (this.records.some((entry, index) => entry.run_id !== runId || entry.cursor !== index + 1)) {
      throw new Error("player observation journal is corrupt");
    }
  }

  get cursor(): number { return this.records.length; }

  append(change: Omit<PlayerChange, "cursor">): PlayerChange {
    const record = { ...change, cursor: this.cursor + 1 };
    appendFileSync(this.file, `${JSON.stringify(record)}\n`, { mode: 0o600 });
    this.records.push(record);
    return record;
  }

  after(cursor: number, limit: number): { changes: PlayerChange[]; next_cursor: number; has_more: boolean } {
    const changes = this.records.slice(cursor, cursor + limit);
    return {
      changes,
      next_cursor: changes.at(-1)?.cursor ?? cursor,
      has_more: cursor + changes.length < this.records.length,
    };
  }

  all(): readonly PlayerChange[] { return this.records; }
}
