"use client";

import { useEffect, useRef, useState } from "react";
import { initializeMonaco } from "./monacoRuntime";
import balanceSchema from "@/lib/content/balance.schema.json";
import { parseBalance } from "@/lib/content/balance";
import { expressionCompletions } from "@/lib/content/balanceHelp";
import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react";
import type { editor, Position } from "monaco-editor";
import { configureMonacoYaml, type JSONSchema } from "monaco-yaml";
import { parseDocument } from "yaml";
import entitySchema from "@bitwars/content/entity.schema.json";
import spawnSchema from "@/lib/content/spawn.schema.json";
import technologySchema from "@bitwars/content/technology.schema.json";
import { entityCombatRangeWarnings, resourceSharingPolicyErrors, resourceReserveErrors, depotErrors } from "@/lib/content/schemaValidation";
import { completionHelp, hoverHelp } from "@/lib/content/editorHelp";

let yamlConfigured = false;
function ids(path: "entities" | "technologies"): Promise<string[]> {
  return fetch(`/api/content/${path}`)
    .then((response) => response.ok ? response.json() : {})
    .then((data: { entities?: Array<{ id: string }>; technologies?: Array<{ id: string }> }) => (data[path] ?? []).map((item) => item.id))
    .catch(() => []);
}

const configureYaml: BeforeMount = (monaco) => {
  if (yamlConfigured) return;
  // monaco-worker-manager passes legacy moduleId/createData options. Recent
  // Monaco expects an initialized Worker instead, so adapt this plugin locally.
  const yamlMonaco = {
    ...monaco,
    editor: {
      ...monaco.editor,
      createWebWorker<T extends object>(options: editor.IWebWorkerOptions) {
        const worker = new Worker(new URL("./monacoYaml.worker.ts", import.meta.url), { type: "module" });
        // monaco-worker-manager consumes the first message to install its
        // initializer. The second supplies the language-service configuration.
        worker.postMessage(null);
        worker.postMessage(options.createData);
        return monaco.editor.createWebWorker<T>({ ...options, worker } as editor.IWebWorkerOptions);
      },
    },
  };
  configureMonacoYaml(yamlMonaco as Parameters<typeof configureMonacoYaml>[0], {
    schemas: [{
      fileMatch: ["**/*.balance.yaml"],
      schema: balanceSchema as unknown as JSONSchema,
      uri: "bitwars://schemas/balance.schema.json",
    }, {
      fileMatch: ["**/*.entity.yaml"],
      schema: entitySchema,
      uri: "bitwars://schemas/entity.schema.json",
    }, {
      fileMatch: ["**/*.technology.yaml"],
      schema: technologySchema,
      uri: "bitwars://schemas/technology.schema.json",
    }, {
      fileMatch: ["**/*.spawn.yaml"],
      schema: spawnSchema,
      uri: "bitwars://schemas/spawn.schema.json",
    }],
    disableAdditionalProperties: true,
    // Schema-based help below also works without a YAML language-service worker.
    hover: false,
    completion: false,
    validate: true,
  });
  monaco.languages.registerHoverProvider("yaml", {
    provideHover(model: editor.ITextModel, position: Position) {
      if (!model.uri.toString().includes("file:///bitwars/") || /\.(scenario|balance)\.yaml$/.test(model.uri.toString())) return null;
      const kind = model.uri.toString().endsWith(".spawn.yaml") ? "spawn" : model.uri.toString().endsWith(".technology.yaml") ? "technology" : "entity";
      const description = hoverHelp(model.getValue(), model.getOffsetAt(position), kind);
      return description ? { contents: [{ value: description }] } : null;
    },
  });
  monaco.languages.registerCompletionItemProvider("yaml", {
    triggerCharacters: [":", " ", "."],
    async provideCompletionItems(model: editor.ITextModel, position: Position) {
      if (!model.uri.toString().includes("file:///bitwars/") || /\.(scenario|balance)\.yaml$/.test(model.uri.toString())) return { suggestions: [] };
      const segment = model.getLineContent(position.lineNumber).slice(0, position.column - 1).match(/[a-z0-9_-]*$/i)?.[0] ?? "";
      const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: position.column - segment.length, endColumn: position.column };
      const kind = model.uri.toString().endsWith(".spawn.yaml") ? "spawn" : model.uri.toString().endsWith(".technology.yaml") ? "technology" : "entity";
      const help = completionHelp(model.getValue(), model.getOffsetAt({ ...position, column: range.startColumn }), model.getOffsetAt({ ...position, column: range.endColumn }), kind);
      const suggestions = help.suggestions.map((item) => ({ ...item, range, kind: item.property ? monaco.languages.CompletionItemKind.Property : monaco.languages.CompletionItemKind.EnumMember }));
      if (help.references) suggestions.push(...(await ids(help.references)).map((label) => ({ label, insertText: label, range, kind: monaco.languages.CompletionItemKind.Reference })));
      return { suggestions };
    },
  });
  yamlConfigured = true;
};

const entityFields = new Set(Object.keys(entitySchema.properties ?? {}));

function markerForLine(
  monaco: Parameters<OnMount>[1],
  line: string | undefined,
  lineNumber: number,
  message: string,
) {
  return {
    severity: monaco.MarkerSeverity.Warning,
    message,
    startLineNumber: lineNumber,
    startColumn: 1,
    endLineNumber: lineNumber,
    endColumn: Math.max(2, (line?.length ?? 0) + 1),
  };
}

function semanticRangeMarkers(model: Parameters<OnMount>[0]["getModel"] extends () => infer Model ? NonNullable<Model> : never, monaco: Parameters<OnMount>[1]) {
  const document = parseDocument(model.getValue());
  if (document.errors.length) return [];
  const warnings = entityCombatRangeWarnings(document.toJS());
  const lines = model.getLinesContent();
  const combatLine = lines.findIndex((line) => /^combat:\s*(?:#.*)?$/.test(line));
  const sensorLine = lines.findIndex((line) => /^sensor:\s*(?:#.*)?$/.test(line));
  const sensorRangeLine = sensorLine >= 0
    ? lines.findIndex((line, index) => index > sensorLine && /^\s+range:/.test(line))
    : -1;
  const attacksLine = lines.findIndex((line) => /^\s+attacks:\s*(?:#.*)?$/.test(line));
  const attackRangeLines: number[] = [];
  if (attacksLine >= 0) {
    const attacksIndent = lines[attacksLine].match(/^\s*/)?.[0].length ?? 0;
    for (let index = attacksLine + 1; index < lines.length; index += 1) {
      const line = lines[index];
      const indent = line.match(/^\s*/)?.[0].length ?? 0;
      if (line.trim() && indent <= attacksIndent) break;
      if (/^\s+range:/.test(line)) attackRangeLines.push(index);
    }
  }
  return warnings.map((warning) => {
    const lineIndex = warning.kind === "sensor"
      ? sensorRangeLine >= 0 ? sensorRangeLine : combatLine
      : attackRangeLines[warning.attackIndex ?? -1] ?? combatLine;
    return markerForLine(monaco, lines[lineIndex], Math.max(1, lineIndex + 1), warning.message);
  });
}

function updateContentMarkers(model: Parameters<OnMount>[0]["getModel"] extends () => infer Model ? NonNullable<Model> : never, monaco: Parameters<OnMount>[1]) {
  const markers = model.getLinesContent().flatMap((line, index) => {
    const field = line.match(/^([a-z][a-z0-9_]*):/i)?.[1];
    if (!field || entityFields.has(field)) return [];
    return [{
      severity: monaco.MarkerSeverity.Error,
      message: `Unknown entity field '${field}'`,
      startLineNumber: index + 1,
      startColumn: 1,
      endLineNumber: index + 1,
      endColumn: field.length + 1,
    }];
  });
  monaco.editor.setModelMarkers(model, "bitwars-content-unknown-fields", markers);
  const deprecated = new Set(["resource_sharing", "resource_reserves", "refinery", "deposit_entity_types", "spend_rates"]);
  monaco.editor.setModelMarkers(model, "bitwars-content-deprecated-fields", model.getLinesContent().flatMap((line, index) => {
    const field = line.match(/^\s*([a-z][a-z0-9_]*):/i)?.[1];
    if (!field || !deprecated.has(field)) return [];
    const replacement = field === "spend_rates" ? "Use duration_seconds; costs are paid upfront." : "Use depot, depot_range, and physical cargo. This field is ignored.";
    return [{...markerForLine(monaco, line, index + 1, `${field} is deprecated. ${replacement}`), severity: monaco.MarkerSeverity.Warning}];
  }));
  const document = parseDocument(model.getValue());
  const lines = model.getLinesContent();
  monaco.editor.setModelMarkers(model, "bitwars-content-resource-sharing", document.errors.length ? []
    : [...depotErrors(document.toJS()), ...resourceSharingPolicyErrors(document.toJS()), ...resourceReserveErrors(document.toJS())].map((message) => {
      const field = `${message.split(/[.:[\s]/)[0]}:`;
      const line = Math.max(0, lines.findIndex((text) => text.startsWith(field)));
      return { ...markerForLine(monaco, lines[line], line + 1, message), severity: monaco.MarkerSeverity.Error };
    }));
  monaco.editor.setModelMarkers(
    model,
    "bitwars-content-combat-range-warnings",
    semanticRangeMarkers(model, monaco),
  );
}

const markUnknownEntityFields: OnMount = (editor, monaco) => {
  let contentSubscription: { dispose(): void } | undefined;
  const attachMarkers = () => {
    contentSubscription?.dispose();
    const model = editor.getModel();
    if (!model) return;
    const update = () => updateContentMarkers(model, monaco);
    update();
    contentSubscription = model.onDidChangeContent(update);
  };
  attachMarkers();
  const modelSubscription = editor.onDidChangeModel(attachMarkers);
  editor.onDidDispose(() => {
    contentSubscription?.dispose();
    modelSubscription.dispose();
  });
};

const triggerDotSuggestions: OnMount = (editor) => {
  const subscription = editor.onDidChangeModelContent(({ changes }) => {
    if (changes.some(({ text }) => text === ".")) void editor.trigger("bitwars", "editor.action.triggerSuggest", {});
  });
  editor.onDidDispose(() => subscription.dispose());
};

export default function YamlEditor({ id, value, onChange, kind = "entity", fieldPaths = [] }: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  kind?: "entity" | "technology" | "scenario" | "spawn" | "balance";
  fieldPaths?: string[];
}) {
  const [ready, setReady] = useState(false);
  const [initializationError, setInitializationError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setInitializationError("");
    void initializeMonaco().then(() => {
      if (!cancelled) setReady(true);
    }).catch(error => {
      if (!cancelled) setInitializationError(error instanceof Error ? error.message : "Unable to initialize editor");
    });
    return () => { cancelled = true; };
  }, [attempt]);
  const pathsRef = useRef(fieldPaths);
  pathsRef.current = fieldPaths;
  if (initializationError) return <div role="alert" className="p-4 text-sm text-red-300">
    Unable to load YAML editor: {initializationError}
    <button type="button" className="ml-3 rounded border border-slate-600 px-3 py-1" onClick={() => setAttempt(current => current + 1)}>Retry</button>
  </div>;
  if (!ready) return <output className="block p-4 text-sm text-slate-400">Loading YAML editor…</output>;
  return <Editor
    beforeMount={configureYaml}
    height="calc(100vh - 13rem)"
    language="yaml"
    onMount={(editor, monaco) => {
      if (kind === "entity") markUnknownEntityFields(editor, monaco);
      triggerDotSuggestions(editor, monaco);
      if (kind === "balance") {
        const update = () => {
          const model = editor.getModel(); if (!model) return;
          let message = "";
          try { parseBalance(model.getValue()); } catch (error) { message = (error as Error).message; }
          monaco.editor.setModelMarkers(model, "bitwars-balance", message ? [{ severity: monaco.MarkerSeverity.Error, message, startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 2 }] : []);
        };
        update();
        const change = editor.onDidChangeModelContent(update);
        const models = editor.onDidChangeModel(update);
        const provider = monaco.languages.registerCompletionItemProvider("yaml", {
          triggerCharacters: [".", ":", " "],
          provideCompletionItems(model, position) {
            if (model !== editor.getModel()) return { suggestions: [] };
            const line = model.getLineContent(position.lineNumber).slice(0, position.column - 1);
            const expression = /^\s*expression:\s*/.test(line);
            const prefix = line.match(expression ? /[a-zA-Z0-9_.*]*$/ : /[a-zA-Z_]*$/)?.[0] ?? "";
            const segment = expression ? prefix.split(".").at(-1) ?? "" : prefix;
            const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: position.column - segment.length, endColumn: position.column };
            const entries = expression
              ? [...expressionCompletions(prefix, pathsRef.current), ...(!prefix.includes(".") ? ["sum", "max"].filter(name => name.startsWith(prefix)).map(name => ({ label: name, insertText: `${name}(` })) : [])]
              : line.includes(":")
                ? (/visualization_type:/.test(line) ? ["scatter_plot", "bar_chart"] : /order:/.test(line) ? ["descending", "ascending"] : []).map(label => ({ label, insertText: label }))
                : ["version", "id", "name", "visualization_type", "dot_size", "x", "y", "value", "expression", "label", "order"].map(label => ({ label, insertText: `${label}: ` }));
            return { suggestions: entries.map(entry => ({ ...entry, range, kind: monaco.languages.CompletionItemKind.Property })) };
          },
        });
        editor.onDidDispose(() => { change.dispose(); models.dispose(); provider.dispose(); });
      }
    }}
    onChange={(next) => onChange(next ?? "")}
    options={{ automaticLayout: true, minimap: { enabled: false }, scrollBeyondLastLine: false, wordWrap: "on" }}
    path={`file:///bitwars/${id}.${kind}.yaml`}
    theme="vs-dark"
    value={value}
  />;
}
