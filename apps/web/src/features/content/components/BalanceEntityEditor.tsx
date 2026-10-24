"use client";

import { useEffect, useMemo, useState } from "react";
import YamlEditor from "./YamlEditor";

export type EditableBalanceEntity = {
  id: string;
  definition: string;
  data: unknown;
};
type Draft = { yaml: string; baseline: string };
const button =
  "rounded border border-slate-600 px-3 py-1 text-sm disabled:opacity-40";

export default function BalanceEntityEditor({
  entities,
  selectedId,
  search,
  onSearchChange,
  onSelect,
  onSaved,
  onDirtyChange,
}: {
  entities: EditableBalanceEntity[];
  selectedId: string;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (id: string) => void;
  onSaved: () => Promise<void>;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const sorted = useMemo(
    () => [...entities].sort((a, b) => a.id.localeCompare(b.id)),
    [entities],
  );
  const selected = entities.find((entity) => entity.id === selectedId);
  const draft = drafts[selectedId];
  const value = draft?.yaml ?? selected?.definition ?? "";
  const dirty = draft !== undefined && draft.yaml !== draft.baseline;
  const anyDirty = Object.values(drafts).some(
    (draft) => draft.yaml !== draft.baseline,
  );
  useEffect(() => {
    onDirtyChange(anyDirty);
  }, [anyDirty, onDirtyChange]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: Clear feedback when the selected entity changes.
  useEffect(() => {
    setError("");
    setMessage("");
  }, [selectedId]);

  async function save() {
    if (!selected) return;
    const id = selected.id;
    const submitted = value;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        `/api/content/entities/${encodeURIComponent(id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ definition: submitted }),
        },
      );
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "Unable to save entity definition");
      setDrafts((current) => ({
        ...current,
        [id]: { yaml: current[id]?.yaml ?? submitted, baseline: submitted },
      }));
      try {
        await onSaved();
        setMessage(`Saved ${id}.`);
      } catch {
        setError(
          `Saved ${id}, but could not refresh entity definitions. Reload to refresh the chart.`,
        );
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to save entity definition",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <label className="mb-4 block text-sm" htmlFor="balance-entity-search">
        Entity ID
        <input
          id="balance-entity-search"
          type="search"
          list="balance-entity-options"
          autoComplete="off"
          placeholder="Search entity_id…"
          className="mt-2 w-full rounded border border-slate-600 bg-slate-950 px-3 py-2"
          value={search}
          disabled={saving || !entities.length}
          onChange={(event) => {
            const id = event.target.value;
            onSearchChange(id);
            if (entities.some((entity) => entity.id === id)) onSelect(id);
          }}
        />
      </label>
      <datalist id="balance-entity-options">
        {sorted.map((entity) => (
          <option key={entity.id} value={entity.id} />
        ))}
      </datalist>
      {search && !entities.some((entity) => entity.id === search) && (
        <p className="mb-3 text-sm text-slate-400">
          Choose a matching entity ID to load its definition.
        </p>
      )}
      {selected ? (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="mr-auto text-sm font-medium">{selected.id}</h2>
            {dirty && (
              <span className="text-xs text-slate-400">Unsaved changes</span>
            )}
            <button
              type="button"
              className={button}
              disabled={saving || !dirty}
              onClick={() => void save()}
            >
              {saving ? "Saving…" : "Save entity"}
            </button>
            <button
              type="button"
              className={button}
              disabled={saving || !dirty}
              onClick={() => {
                setDrafts((current) => {
                  const next = { ...current };
                  delete next[selected.id];
                  return next;
                });
                setError("");
                setMessage("");
              }}
            >
              Cancel
            </button>
          </div>
          {error && (
            <p className="mb-3 text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          {message && (
            <output className="mb-3 block text-sm text-cyan-300">
              {message}
            </output>
          )}
          <section
            aria-label="Entity definition YAML"
            className="overflow-hidden rounded-lg border border-slate-700"
          >
            <YamlEditor
              kind="entity"
              id={selected.id}
              value={value}
              onChange={(yaml) => {
                setDrafts((current) => ({
                  ...current,
                  [selected.id]: {
                    yaml,
                    baseline:
                      current[selected.id]?.baseline ?? selected.definition,
                  },
                }));
                setMessage("");
              }}
            />
          </section>
        </>
      ) : (
        <p className="text-sm text-slate-400">
          Search for an entity ID or click an entity in the visualization to
          edit its definition.
        </p>
      )}
    </>
  );
}
