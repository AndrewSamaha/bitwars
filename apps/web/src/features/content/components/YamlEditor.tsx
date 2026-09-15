"use client";

import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react";
import { configureMonacoYaml } from "monaco-yaml";
import { parseDocument } from "yaml";
import entitySchema from "@bitwars/content/entity.schema.json";
import { entityCombatRangeWarnings } from "@/lib/content/schemaValidation";

let yamlConfigured = false;

const configureYaml: BeforeMount = (monaco) => {
  if (yamlConfigured) return;
  configureMonacoYaml(monaco, {
    schemas: [{
      fileMatch: ["**/*.entity.yaml"],
      schema: entitySchema,
      uri: "bitwars://schemas/entity.schema.json",
    }],
    disableAdditionalProperties: true,
    validate: true,
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

export default function YamlEditor({ id, value, onChange }: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return <Editor
    beforeMount={configureYaml}
    height="calc(100vh - 13rem)"
    language="yaml"
    onMount={markUnknownEntityFields}
    onChange={(next) => onChange(next ?? "")}
    options={{ automaticLayout: true, minimap: { enabled: false }, scrollBeyondLastLine: false, wordWrap: "on" }}
    path={`file:///bitwars/${id}.entity.yaml`}
    theme="vs-dark"
    value={value}
  />;
}
