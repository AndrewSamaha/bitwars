"use client";

import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react";
import type { editor, Position } from "monaco-editor";
import { configureMonacoYaml } from "monaco-yaml";
import { parseDocument } from "yaml";
import entitySchema from "@bitwars/content/entity.schema.json";
import technologySchema from "@bitwars/content/technology.schema.json";
import { entityCombatRangeWarnings } from "@/lib/content/schemaValidation";
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
  configureMonacoYaml(monaco, {
    schemas: [{
      fileMatch: ["**/*.entity.yaml"],
      schema: entitySchema,
      uri: "bitwars://schemas/entity.schema.json",
    }, {
      fileMatch: ["**/*.technology.yaml"],
      schema: technologySchema,
      uri: "bitwars://schemas/technology.schema.json",
    }],
    disableAdditionalProperties: true,
    // Schema-based help below also works without a YAML language-service worker.
    hover: false,
    completion: false,
    validate: true,
  });
  monaco.languages.registerHoverProvider("yaml", {
    provideHover(model: editor.ITextModel, position: Position) {
      if (!model.uri.toString().includes("file:///bitwars/")) return null;
      const kind = model.uri.toString().endsWith(".technology.yaml") ? "technology" : "entity";
      const description = hoverHelp(model.getValue(), model.getOffsetAt(position), kind);
      return description ? { contents: [{ value: description }] } : null;
    },
  });
  monaco.languages.registerCompletionItemProvider("yaml", {
    triggerCharacters: [":", " ", "."],
    async provideCompletionItems(model: editor.ITextModel, position: Position) {
      if (!model.uri.toString().includes("file:///bitwars/")) return { suggestions: [] };
      const segment = model.getLineContent(position.lineNumber).slice(0, position.column - 1).match(/[a-z0-9_-]*$/i)?.[0] ?? "";
      const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: position.column - segment.length, endColumn: position.column };
      const kind = model.uri.toString().endsWith(".technology.yaml") ? "technology" : "entity";
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

export default function YamlEditor({ id, value, onChange, kind = "entity" }: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  kind?: "entity" | "technology";
}) {
  return <Editor
    beforeMount={configureYaml}
    height="calc(100vh - 13rem)"
    language="yaml"
    onMount={(editor, monaco) => {
      if (kind === "entity") markUnknownEntityFields(editor, monaco);
      triggerDotSuggestions(editor, monaco);
    }}
    onChange={(next) => onChange(next ?? "")}
    options={{ automaticLayout: true, minimap: { enabled: false }, scrollBeyondLastLine: false, wordWrap: "on" }}
    path={`file:///bitwars/${id}.${kind}.yaml`}
    theme="vs-dark"
    value={value}
  />;
}
