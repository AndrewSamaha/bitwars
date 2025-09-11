"use client";

import React, { useEffect, useState } from "react";
import { game } from "../world";

function countWorldEntities(): number {
  const w: any = game.world as any;
  const ent = (w && w.entities) as any;
  if (!ent) return 0;
  if (Array.isArray(ent)) return ent.length;
  if (typeof ent.size === "number") return ent.size;
  try {
    if (typeof ent[Symbol.iterator] === "function") {
      let n = 0;
      for (const _ of ent as Iterable<any>) n++;
      return n;
    }
  } catch {}
  // Fallback: try common queries to approximate
  try {
    let n = 0;
    for (const _ of w.with?.("id") ?? []) n++;
    if (n > 0) return n;
  } catch {}
  return 0;
}

export default function EcsEntityCount({ intervalMs = 500 }: { intervalMs?: number }) {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    const tick = () => {
      if (!mounted) return;
      setCount(countWorldEntities());
    };
    const id = setInterval(tick, intervalMs);
    tick();
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [intervalMs]);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>Entities: {count}</span>
    </div>
  );
}
