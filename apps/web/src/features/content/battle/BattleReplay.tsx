"use client";

import { useEffect, useState } from "react";
import BattleBoard, { type BoardReplay } from "./BattleBoard";
import { TEAM_LABEL, type Draft, type Unit } from "./model";
import type { Frame, Ready, ReplayEvent } from "./useBattleRun";

const BUTTON = "rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm hover:border-cyan-400";
const OUTCOMES = { a: "Team A wins", b: "Team B wins", draw: "Draw — both teams eliminated", tick_limit: "Tick limit — no winner. Review acquisition ranges and starting distance." };

function replayAt(frames: Frame[], tick: number, tps: number): BoardReplay {
  const index = Math.min(frames.length - 1, Math.max(0, Math.floor(tick)));
  const alpha = Math.min(1, Math.max(0, tick - index));
  const current = frames[index];
  if (!current) return { hulls: [], shots: [], effects: [] };
  const next = frames[index + 1];
  const effects: BoardReplay["effects"] = [];
  // Rebuild effects from the timeline every time, including backward seeks.
  if (tick > 0) {
    const window = Math.max(1, Math.min(24, tps * 0.28));
    const last = Math.min(alpha > 0 ? index + 1 : index, frames.length - 1);
    for (let i = Math.max(1, index - Math.ceil(window)); i <= last; i++) {
      frames[i].events.forEach((e, j) => {
        const fraction = e.kind === "laser" ? 0 : e.kind === "launch" ? 1 : e.fraction;
        const time = i - 1 + fraction;
        if (time <= tick && time >= tick - window) effects.push({ ...e, key: `${i}-${j}` });
      });
    }
  }
  if (!next || alpha <= 0) return { hulls: current.hulls, shots: current.shots, effects };
  const deaths = new Map<number, Extract<ReplayEvent, { kind: "casualty" }>>();
  const ends = new Map<number, Extract<ReplayEvent, { kind: "shot_end" }>>();
  for (const e of next.events) {
    if (e.kind === "casualty") deaths.set(e.victim, e);
    if (e.kind === "shot_end") ends.set(e.shot, e);
  }
  const hulls = new Map(next.hulls.map(h => [h[0], h]));
  const motion = new Map(next.hull_motion?.map(([id, start, stop, fraction]) => [id, { start, stop, fraction }]));
  const shots = new Map(next.shots.map(s => [s[0], s]));
  const presentation: BoardReplay = { effects, hulls: [], shots: [] };
  for (const [id, x, y, hp] of current.hulls) {
    const end = deaths.get(id);
    if (end && alpha >= end.fraction) continue;
    const path = motion.get(id);
    if (path) {
      const scale = path.fraction > 0 ? Math.min(alpha / path.fraction, 1) : 1;
      const [sx, sy] = path.start;
      const [ex, ey] = path.stop;
      presentation.hulls.push([id, sx + (ex - sx) * scale, sy + (ey - sy) * scale, hp]);
      continue;
    }
    const p = hulls.get(id);
    const scale = alpha / (end?.fraction ?? 1);
    presentation.hulls.push([id, x + ((end?.x ?? p?.[1] ?? x) - x) * scale, y + ((end?.y ?? p?.[2] ?? y) - y) * scale, hp]);
  }
  for (const [id, x, y] of current.shots) {
    const end = ends.get(id);
    if (end && alpha >= end.fraction) continue;
    const p = shots.get(id);
    const scale = alpha / (end?.fraction ?? 1);
    presentation.shots.push([id, x + ((end?.x ?? p?.[1] ?? x) - x) * scale, y + ((end?.y ?? p?.[2] ?? y) - y) * scale]);
  }
  return presentation;
}

export default function BattleReplay({ draft, units, ready, frames }: { draft: Draft; units: Map<string, Unit>; ready: Ready; frames: Frame[] }) {
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selected, setSelected] = useState("");
  const atEnd = cursor >= ready.last_tick;
  useEffect(() => {
    if (!playing || atEnd) return;
    let last = performance.now();
    let request: number;
    function animate(now: number) {
      // The first animation frame can carry a timestamp earlier than the
      // effect's setup time; never step the cursor backward below tick 0.
      const elapsed = Math.min(100, Math.max(0, now - last));
      last = now;
      setCursor(tick => Math.min(ready.last_tick, Math.max(0, tick + elapsed * ready.tps * speed / 1000)));
      request = requestAnimationFrame(animate);
    }
    request = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(request);
  }, [playing, atEnd, ready, speed]);

  const presentation = replayAt(frames, cursor, ready.tps);
  const living = new Map(presentation.hulls.map(h => [h[0], h[3]]));
  const tick = Math.min(frames.length - 1, Math.max(0, Math.floor(cursor)));
  const exactEvents = frames[tick]?.events ?? [];
  return <section className="space-y-3">
    <p role="status" className="rounded bg-slate-900 px-3 py-2 font-medium">Replay ready · {OUTCOMES[ready.outcome]}</p>
    <div className="flex flex-wrap items-center gap-3">
      <button className={BUTTON} type="button" onClick={() => {
        if (atEnd) { setCursor(0); setPlaying(true); }
        else setPlaying(!playing);
      }}>{atEnd ? "Play again" : playing ? "Pause" : "Play"}</button>
      <label>Speed <select className={BUTTON} value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
        {[0.25, 0.5, 1, 2, 4].map(s => <option key={s} value={s}>{s}×</option>)}
      </select></label>
      <span className="font-mono text-sm tabular-nums">Tick {tick} / {ready.last_tick} · {(cursor / ready.tps).toFixed(2)} s · {ready.tps} TPS</span>
    </div>
    <label className="flex items-center gap-3 text-sm">Replay timeline
      <input className="min-w-20 flex-1 accent-cyan-400" type="range" min={0} max={ready.last_tick} step={1} value={tick}
        onChange={event => { setPlaying(false); setCursor(Number(event.target.value)); }} />
    </label>
    <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
      <BattleBoard draft={draft} units={units} selected={selected} replay={presentation} />
      <aside className="space-y-3 rounded border border-slate-700 bg-slate-900 p-3">
        <h2 className="font-semibold">Replay roster</h2>
        <ul className="max-h-60 space-y-1 overflow-auto text-sm">
          {draft.placements.map((p, i) => <li key={p.id}>
            <button type="button" aria-pressed={selected === p.id} className="w-full rounded border border-slate-700 px-2 py-1 text-left aria-pressed:border-cyan-400" onClick={() => setSelected(p.id)}>
              {TEAM_LABEL[p.team]} · {p.type_id} #{i + 1} — {living.has(i + 1) ? `${living.get(i + 1)!.toFixed(1)} HP` : "Destroyed"}
            </button>
          </li>)}
        </ul>
        <h3 className="font-semibold">Events at tick {tick}</h3>
        <p className="text-xs text-slate-400">Pink line: laser. Orange dot: shot. Gold ring: contact. Dotted ring: expiry. Red ×: casualty.</p>
        {exactEvents.length === 0 ? <p className="text-sm text-slate-400">No combat events this tick.</p>
          : <ul className="max-h-44 space-y-1 overflow-auto text-sm">{exactEvents.map((e, i) => <li key={i}>
            {e.kind === "laser" ? `#${e.attacker} fired a laser at #${e.target}`
              : e.kind === "launch" ? `#${e.attacker} launched shot ${e.shot}`
              : e.kind === "casualty" ? `#${e.attacker} destroyed #${e.victim} (${e.cause})`
              : e.reason === "contact" ? `Shot ${e.shot} hit #${e.target}` : `Shot ${e.shot} expired at ${e.reason === "wall" ? "the wall" : "its travel limit"}`}
          </li>)}</ul>}
      </aside>
    </div>
  </section>;
}
