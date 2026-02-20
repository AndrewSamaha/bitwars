"use client";

import React from "react";

export type ActionDef = { key: string; name: string; enabled?: boolean; value: "Move" | "Collect" };

export type AvailableActionProps = {
  action: ActionDef;
  active?: boolean;
  onClick?: (action: ActionDef) => void;
};

export default function AvailableAction({ action, active = false, onClick }: AvailableActionProps) {
  const { key: keyChar, name, enabled = true } = action;
  const base = "px-2 py-1 rounded text-xs select-none cursor-pointer border";
  const activeCls = "bg-primary text-primary-foreground border-primary";
  const inactiveCls = enabled ? "bg-muted hover:bg-accent border-border" : "bg-muted/50 text-muted-foreground border-border cursor-not-allowed";

  return (
    <div
      className={`${base} ${active ? activeCls : inactiveCls}`}
      onClick={() => enabled && onClick?.(action)}
      role="button"
      aria-pressed={active}
      title={active ? `${name} (selected)` : `Press '${keyChar.toUpperCase()}' to ${name}`}
    >
      <span className="font-mono">[{keyChar}]</span>
      <span className="ml-1 capitalize">{name}</span>
    </div>
  );
}
