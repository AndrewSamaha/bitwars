"use client";

import { useEffect, useRef, useState } from "react";
import { BattleRequestError, battleRequest, type Draft } from "./model";

export type ReplayEvent =
  | { kind: "laser"; attacker: number; target: number; from: [number, number]; to: [number, number] }
  | { kind: "launch"; shot: number; attacker: number; x: number; y: number; vx: number; vy: number }
  | { kind: "shot_end"; shot: number; reason: "contact" | "range" | "wall"; target: number | null; x: number; y: number; fraction: number }
  | { kind: "casualty"; victim: number; attacker: number; cause: "laser" | "kinetic" | "dismantle"; x: number; y: number; fraction: number };
export type Frame = {
  tick: number;
  hulls: [id: number, x: number, y: number, health: number][];
  shots: [id: number, x: number, y: number][];
  hull_motion?: [id: number, start: [number, number], stop: [number, number], fraction: number][];
  events: ReplayEvent[];
};
export type Ready = { status: "ready"; run_id: string; tps: number; last_tick: number; outcome: "a" | "b" | "draw" | "tick_limit"; page_count: number };
type Status = Ready | { status: "pending"; run_id: string } | { status: "rejected" | "failed"; run_id: string; code: string; message: string };
type RunView = { kind: "edit" } | { kind: "submitting" }
  | { kind: "pending"; id: string } | { kind: "loading"; id: string; loaded: number; total: number }
  | { kind: "check"; id: string; error: string }
  | { kind: "replay"; id: string; ready: Ready; frames: Frame[] };

type Operation = { generation: number; id: string | null; draft: Draft; controller: AbortController };

export function useBattleRun(restore: (draft: Draft, error?: string) => void) {
  const [view, setView] = useState<RunView>({ kind: "edit" });
  const operation = useRef<Operation | null>(null);
  const generation = useRef(0);

  useEffect(() => () => {
    generation.current++;
    operation.current?.controller.abort();
    operation.current = null;
  }, []);

  function current(op: Operation, id = op.id) {
    return operation.current === op && generation.current === op.generation && operation.current.id === id && !op.controller.signal.aborted;
  }

  function release(op: Operation, error?: string) {
    if (!current(op)) return;
    generation.current++;
    op.controller.abort();
    operation.current = null;
    restore(op.draft, error);
    setView({ kind: "edit" });
  }

  async function observe(op: Operation, id: string) {
    const signal = op.controller.signal;
    let loading = false;
    try {
      let status: Status;
      for (;;) {
        // Older dev browsers do not implement Promise.withResolvers.
        await new Promise<void>(resolve => {
          const timer = setTimeout(() => {
            signal.removeEventListener("abort", abort);
            resolve();
          }, 300);
          const abort = () => { clearTimeout(timer); resolve(); };
          signal.addEventListener("abort", abort, { once: true });
        });
        if (!current(op, id)) return;
        status = await battleRequest<Status>(`/${id}`, { signal });
        if (!current(op, id)) return;
        if (status.run_id !== id) throw new Error("Runner returned status for a different run.");
        if (status.status !== "pending") break;
      }
      if (status.status !== "ready") {
        release(op, `${status.status === "rejected" ? "Run rejected" : "Run failed"}: ${status.message}`);
        return;
      }
      loading = true;
      const frames: Frame[] = [];
      if (!Number.isInteger(status.page_count) || status.page_count < 1 || status.page_count > 2401 || status.last_tick > 2400 || status.tps <= 0) {
        throw new Error("Runner returned invalid replay metadata.");
      }
      setView({ kind: "loading", id, loaded: 0, total: status.page_count });
      for (let page = 0; page < status.page_count; page++) {
        const result = await battleRequest<{ run_id: string; page: number; frames: Frame[] }>(`/${id}/replay?page=${page}`, { signal });
        if (!current(op, id)) return;
        if (result.run_id !== id || result.page !== page || result.frames.some((frame, i) => frame.tick !== frames.length + i)) {
          throw new Error("Runner returned out-of-order replay data.");
        }
        frames.push(...result.frames);
        setView({ kind: "loading", id, loaded: page + 1, total: status.page_count });
      }
      if (frames.length !== status.last_tick + 1 || !frames.length) throw new Error("Runner returned an incomplete replay.");
      setView({ kind: "replay", id, ready: status, frames });
    } catch (error) {
      if (!current(op, id)) return;
      const message = error instanceof Error ? error.message : "Could not read the runner response.";
      if (error instanceof BattleRequestError && error.code === "run_unavailable") {
        release(op, `${loading ? "Replay unavailable" : "Run unavailable"}: ${message}`);
      } else {
        setView({ kind: "check", id, error: `${loading ? "Replay read failed" : "Status check failed"}: ${message}` });
      }
    }
  }

  async function go(draft: Draft) {
    if (operation.current) return;
    const op: Operation = { generation: ++generation.current, id: null, draft: structuredClone(draft), controller: new AbortController() };
    operation.current = op;
    setView({ kind: "submitting" });
    try {
      const { run_id: id } = await battleRequest<{ run_id: string }>("", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(op.draft), signal: op.controller.signal });
      if (!current(op, null)) return;
      if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(id)) throw new Error("Runner returned an invalid run ID.");
      op.id = id;
      setView({ kind: "pending", id });
      await observe(op, id);
    } catch (error) {
      release(op, error instanceof Error ? error.message : "Submission failed. Try Go again.");
    }
  }

  function retry() {
    const op = operation.current;
    if (view.kind !== "check" || !op?.id || !current(op, view.id)) return;
    setView({ kind: "pending", id: op.id });
    void observe(op, op.id);
  }

  function reset() {
    if (operation.current) release(operation.current);
  }

  return { view, go, reset, retry };
}
