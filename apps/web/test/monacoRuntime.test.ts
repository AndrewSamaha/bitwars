import { afterEach, expect, it, vi } from "vitest";

const { config, localMonaco } = vi.hoisted(() => ({
  config: vi.fn(),
  localMonaco: { editor: {}, languages: {} },
}));
vi.mock("@monaco-editor/react", () => ({ loader: { config } }));
vi.mock("monaco-editor/esm/vs/editor/editor.api", () => localMonaco);
vi.mock("monaco-editor/esm/vs/editor/editor.all.js", () => ({}));
vi.mock(
  "monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js",
  () => ({}),
);

import { initializeMonaco } from "@/features/content/components/monacoRuntime";

afterEach(() => vi.unstubAllGlobals());
it("initializes local Monaco once and configures local workers before mounting editors", async () => {
  const browser: { MonacoEnvironment?: { getWorker(): Worker } } = {};
  const WorkerMock = vi.fn();
  vi.stubGlobal("window", browser);
  vi.stubGlobal("Worker", WorkerMock);
  const first = initializeMonaco();
  expect(browser.MonacoEnvironment).toBeDefined();
  expect(initializeMonaco()).toBe(first);
  await first;
  expect(config).toHaveBeenCalledTimes(1);
  expect(config).toHaveBeenCalledWith({ monaco: localMonaco });
  browser.MonacoEnvironment?.getWorker();
  expect(WorkerMock).toHaveBeenCalledWith(expect.any(URL), { type: "module" });
  const url = WorkerMock.mock.calls[0][0] as URL;
  expect(url.pathname).toContain("monacoEditor.worker.ts");
});
