"use client";

import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react";
import { configureMonacoYaml } from "monaco-yaml";
import entitySchema from "@bitwars/content/entity.schema.json";

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

const markUnknownEntityFields: OnMount = (editor, monaco) => {
  const model = editor.getModel();
  if (!model) return;
  const updateMarkers = () => {
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
  };
  updateMarkers();
  const subscription = model.onDidChangeContent(updateMarkers);
  editor.onDidDispose(() => subscription.dispose());
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
