"use client";

import Editor, { type BeforeMount } from "@monaco-editor/react";
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
    validate: true,
  });
  yamlConfigured = true;
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
    onChange={(next) => onChange(next ?? "")}
    options={{ automaticLayout: true, minimap: { enabled: false }, scrollBeyondLastLine: false, wordWrap: "on" }}
    path={`inmemory://bitwars/${id}.entity.yaml`}
    theme="vs-dark"
    value={value}
  />;
}
