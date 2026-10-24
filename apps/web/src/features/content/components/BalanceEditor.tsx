"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { parseDocument } from "yaml";
import {
  type BalanceEntity,
  balanceExamples,
  evaluateBalance,
  parseBalance,
} from "@/lib/content/balance";
import { balanceFieldPaths } from "@/lib/content/balanceHelp";
import BalanceChart from "./BalanceChart";
import ContentNavigation from "./ContentNavigation";
import YamlEditor from "./YamlEditor";

type Saved = { id: string; name: string; yaml: string; error?: string };
const control =
  "rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm disabled:opacity-40";
async function jsonResponse(response: Response) {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Request failed");
  return data;
}
async function loadEntities(signal?: AbortSignal): Promise<BalanceEntity[]> {
  const data = await jsonResponse(
    await fetch("/api/content/entities", { cache: "no-store", signal }),
  );
  if (!Array.isArray(data.entities)) throw new Error("Invalid entity response");
  return data.entities.map((entity: { id: string; definition: string }) => {
    const document = parseDocument(entity.definition);
    if (document.errors.length)
      throw new Error(`Invalid entity YAML: ${entity.id}`);
    return { id: entity.id, data: document.toJS({ maxAliasCount: 0 }) };
  });
}
export default function BalanceEditor() {
  const [yaml, setYaml] = useState(balanceExamples[0].yaml);
  const [baseline, setBaseline] = useState(balanceExamples[0].yaml);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [selection, setSelection] = useState("example:0");
  const [entities, setEntities] = useState<BalanceEntity[] | null>(null);
  const [saved, setSaved] = useState<Saved[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dataError, setDataError] = useState("");
  const [message, setMessage] = useState("");
  const yamlRef = useRef(yaml);
  yamlRef.current = yaml;
  const baselineRef = useRef(baseline);
  baselineRef.current = baseline;
  const dirty = yaml !== baseline;
  const result = useMemo(() => {
    try {
      const config = parseBalance(yaml);
      return {
        config,
        plot: evaluateBalance(config, entities ?? []),
        error: "",
      };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }, [yaml, entities]);
  const paths = useMemo(
    () => balanceFieldPaths((entities ?? []).map((entity) => entity.data)),
    [entities],
  );
  useEffect(() => {
    const controller = new AbortController();
    void loadEntities(controller.signal)
      .then(setEntities)
      .catch((error) => {
        if (!controller.signal.aborted) setDataError(error.message);
      });
    void fetch("/api/content/balance", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(jsonResponse)
      .then((data) => setSaved(data.visualizations))
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message);
      });
    return () => controller.abort();
  }, []);
  // Protect reload/closing a tab as well as explicit draft replacements.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const canReplace = () =>
    yamlRef.current === baselineRef.current ||
    window.confirm("Discard unsaved visualization changes?");
  function replace(next: string, id: string | null, source = `saved:${id}`) {
    setSelection(source);
    setYaml(next);
    setBaseline(next);
    setLoadedId(id);
    setError("");
    setMessage("");
  }
  async function selectSaved(id: string) {
    if (!id || !canReplace()) return;
    const startingYaml = yamlRef.current;
    setBusy(true);
    setError("");
    try {
      const [data, freshEntities] = await Promise.all([
        fetch(`/api/content/balance?id=${encodeURIComponent(id)}`, {
          cache: "no-store",
        }).then(jsonResponse),
        loadEntities(),
      ]);
      if (yamlRef.current !== startingYaml && !canReplace()) return;
      replace(data.yaml, id);
      setEntities(freshEntities);
      setDataError("");
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    const submitted = yaml;
    const config = parseBalance(submitted);
    setBusy(true);
    setError("");
    setMessage("");
    try {
      let overwrite = loadedId === config.id;
      if (!overwrite && saved.some((item) => item.id === config.id)) {
        if (!window.confirm(`Overwrite saved visualization "${config.id}"?`))
          return;
        overwrite = true;
      }
      const send = (replaceExisting: boolean) =>
        fetch("/api/content/balance", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ yaml: submitted, overwrite: replaceExisting }),
        });
      let response = await send(overwrite);
      if (response.status === 409 && !overwrite) {
        if (!window.confirm(`Overwrite saved visualization "${config.id}"?`))
          return;
        response = await send(true);
      }
      await jsonResponse(response);
      setBaseline(submitted);
      setLoadedId(config.id);
      setSelection(`saved:${config.id}`);
      setMessage("Visualization saved.");
      setSaved((current) =>
        [
          ...current.filter((item) => item.id !== config.id),
          { id: config.id, name: config.name ?? config.id, yaml: submitted },
        ].sort((a, b) => a.id.localeCompare(b.id)),
      );
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="px-6 pt-6 lg:px-10">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.24em] text-cyan-400">
          BitWars Content Editor
        </p>
        <ContentNavigation active="balance" />
      </div>
      <div className="flex flex-col lg:flex-row">
        <div className="min-w-0 flex-1 p-6 lg:px-10 lg:pb-10">
          <section aria-label="Balance visualization" className="min-w-0">
            {result.error ? (
              <p
                className="whitespace-pre-wrap rounded border border-red-400/40 p-4 text-red-300"
                role="alert"
              >
                Configuration error: {result.error}
              </p>
            ) : dataError ? (
              <p role="alert" className="text-red-300">
                Unable to load entity definitions: {dataError}{" "}
                <button
                  type="button"
                  className={control}
                  onClick={() => {
                    setDataError("");
                    void loadEntities()
                      .then(setEntities)
                      .catch((error) => setDataError(error.message));
                  }}
                >
                  Retry
                </button>
              </p>
            ) : entities === null ? (
              <output>Loading entity definitions…</output>
            ) : (
              result.config &&
              result.plot && (
                <>
                  <h2 className="mb-3 font-medium">
                    {result.config.name ?? result.config.id}
                  </h2>
                  <BalanceChart
                    config={result.config}
                    points={result.plot.points}
                  />
                </>
              )
            )}
          </section>
          {entities !== null && !dataError && result.plot && (
            <section
              aria-label="Omitted entities"
              className="mt-5 border-t border-slate-700 pt-4"
            >
              <h2 className="font-medium">
                Omitted entities ({result.plot.omissions.length})
              </h2>
              {result.plot.omissions.length ? (
                <ul className="mt-2 space-y-2 text-sm text-slate-300">
                  {result.plot.omissions.map((item) => (
                    <li key={item.id}>
                      <strong>{item.id}</strong>: {item.reasons.join("; ")}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-400">
                  All entities are included.
                </p>
              )}
            </section>
          )}
        </div>
        <aside
          aria-label="Balance settings"
          className="min-w-0 shrink-0 border-t border-slate-700 bg-slate-900 p-6 lg:w-[42rem] lg:border-t-0 lg:border-l"
        >
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <label className="text-sm">
              Visualization{" "}
              <select
                className={control}
                disabled={busy}
                value={selection}
                onChange={(event) => {
                  const source = event.target.value;
                  if (source.startsWith("saved:")) {
                    void selectSaved(source.slice("saved:".length));
                  } else if (source.startsWith("example:")) {
                    const example =
                      balanceExamples[Number(source.slice("example:".length))];
                    if (example && canReplace())
                      replace(example.yaml, null, source);
                  }
                }}
              >
                <optgroup label="Examples">
                  {balanceExamples.map((example, index) => (
                    <option key={example.name} value={`example:${index}`}>
                      {example.name}
                    </option>
                  ))}
                </optgroup>
                {saved.length > 0 && (
                  <optgroup label="Saved visualizations">
                    {saved.map((item) => (
                      <option key={item.id} value={`saved:${item.id}`}>
                        {item.name}
                        {item.error ? " (invalid)" : ""}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </label>
            <button
              type="button"
              className={control}
              disabled={busy || !result.config}
              onClick={() => void save()}
            >
              {busy ? "Working…" : "Save"}
            </button>
            <output className="text-sm text-slate-400">
              {dirty ? "Unsaved changes" : message || "No unsaved changes"}
            </output>
          </div>
          {error && (
            <p className="mb-3 text-red-400" role="alert">
              {error}
            </p>
          )}
          <section
            aria-label="Balance configuration YAML"
            className="min-w-0 overflow-hidden rounded-lg border border-slate-700 bg-slate-900"
          >
            <YamlEditor
              kind="balance"
              id="balance-editor"
              value={yaml}
              fieldPaths={paths}
              onChange={(next) => {
                setYaml(next);
                setMessage("");
              }}
            />
          </section>
        </aside>
      </div>
    </main>
  );
}
