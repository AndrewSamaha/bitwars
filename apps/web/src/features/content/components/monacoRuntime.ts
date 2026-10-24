import { loader } from "@monaco-editor/react";

let initialization: Promise<void> | undefined;

// Load one local Monaco instance before mounting any editors. In particular,
// configure the workers before Monaco can try to initialize a language service.
export function initializeMonaco(): Promise<void> {
  if (!initialization) {
    window.MonacoEnvironment = {
      getWorker() {
        return new Worker(
          new URL("./monacoEditor.worker.ts", import.meta.url),
          { type: "module" },
        );
      },
    };
    initialization = Promise.all([
      import("monaco-editor/esm/vs/editor/editor.api"),
      import("monaco-editor/esm/vs/editor/editor.all.js"),
      import("monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js"),
    ])
      .then(([monaco]) => {
        loader.config({ monaco });
      })
      .catch((error) => {
        initialization = undefined;
        throw error;
      });
  }
  return initialization;
}
