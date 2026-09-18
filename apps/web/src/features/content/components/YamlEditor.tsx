"use client";

import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react";
import type { editor, Position } from "monaco-editor";
import { configureMonacoYaml } from "monaco-yaml";
import { parseDocument } from "yaml";
import entitySchema from "@bitwars/content/entity.schema.json";
import technologySchema from "@bitwars/content/technology.schema.json";
import { entityCombatRangeWarnings } from "@/lib/content/schemaValidation";

let yamlConfigured = false;
let entityIds: Promise<string[]> | undefined;
let technologyIds: Promise<string[]> | undefined;

const hoverDocs: Record<string, string> = {
  sensor: "Optional circular detection area available to this entity.",
  range: "Detection radius in world units. For autonomous combat units, keep this at least combat.acquisition_range.",
  acquisition_range: "Maximum distance at which autonomous combat acquires an enemy, in world units.",
  research_cost: "Resources consumed once when research begins.",
  research_rates: "Per-resource research spend rates in units per second.",
  requires: "A prerequisite technology, or an all/any group of prerequisites.",
  operation: "How an effect changes its target value.",
};

const operationDocs: Record<string, string> = {
  add: "Adds value to the target.",
  multiply: "Multiplies the target by value.",
  set: "Replaces the target with value.",
  cap: "Limits the target to value.",
};

function ids(path: "entities" | "technologies") {
  const cache = path === "entities" ? entityIds : technologyIds;
  if (cache) return cache;
  const request: Promise<string[]> = fetch(`/api/content/${path}`)
    .then((response) => response.ok ? response.json() : {})
    .then((data: { entities?: Array<{ id: string }>; technologies?: Array<{ id: string }> }) => (data[path] ?? []).map((item) => item.id))
    .catch(() => []);
  if (path === "entities") entityIds = request; else technologyIds = request;
  return request;
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
    validate: true,
  });
  monaco.languages.registerHoverProvider("yaml", {
    provideHover(model: editor.ITextModel, position: Position) {
      if (!model.uri.toString().includes("file:///bitwars/")) return null;
      const word = model.getWordAtPosition(position)?.word;
      if (!word) return null;
      const description = operationDocs[word] ?? hoverDocs[word];
      return description ? { contents: [{ value: `**${word}**\n\n${description}` }] } : null;
    },
  });
  monaco.languages.registerCompletionItemProvider("yaml", {
    triggerCharacters: [":", " "],
    async provideCompletionItems(model: editor.ITextModel, position: Position) {
      if (!model.uri.toString().includes("file:///bitwars/")) return { suggestions: [] };
      const line = model.getLineContent(position.lineNumber);
      const range = model.getWordUntilPosition(position);
      const isTechnology = model.uri.toString().endsWith(".technology.yaml");
      const inTechnologyList = /^\s*-\s*\w*$/.test(line)
        && model.getLinesContent().slice(0, position.lineNumber - 1).some((previous) => /^\s*(requires|researches|requires_technologies):/.test(previous));
      const keySuggestions = Object.entries((isTechnology ? technologySchema : entitySchema).properties ?? {}).map(([label, schema]: [string, any]) => ({
        label,
        kind: monaco.languages.CompletionItemKind.Property,
        documentation: schema.description,
        insertText: `${label}: `,
        range,
      }));
      if (/^\s*operation:\s*/.test(line)) return { suggestions: Object.entries(operationDocs).map(([label, documentation]) => ({ label, documentation, kind: monaco.languages.CompletionItemKind.EnumMember, insertText: label, range })) };
      if (/entity_type_id:\s*/.test(line)) return { suggestions: (await ids("entities")).map((label) => ({ label, kind: monaco.languages.CompletionItemKind.Reference, insertText: label, range })) };
      if (inTechnologyList || /(requires|researches|requires_technologies):\s*(?:-\s*)?$/.test(line)) return { suggestions: (await ids("technologies")).map((label) => ({ label, kind: monaco.languages.CompletionItemKind.Reference, insertText: label, range })) };
      return { suggestions: keySuggestions };
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
    onMount={kind === "entity" ? markUnknownEntityFields : undefined}
    onChange={(next) => onChange(next ?? "")}
    options={{ automaticLayout: true, minimap: { enabled: false }, scrollBeyondLastLine: false, wordWrap: "on" }}
    path={`file:///bitwars/${id}.${kind}.yaml`}
    theme="vs-dark"
    value={value}
  />;
}
