"use client";
import Link from "next/link";
import ContentReloadPanel from "./ContentReloadPanel";
import { useBattleAccess } from "../battle/BattleNavigation";

const tabs = [
  ["entities", "Entities"],
  ["techtree", "Techtree"],
  ["sprite-library", "Sprites"],
  ["sfx", "SFX"],
  ["scenarios", "Scenarios"],
  ["spawn", "Spawn"],
  ["balance", "Balance"],
];
export default function ContentNavigation({ active, confirmLeave }: { active: string; confirmLeave?: () => boolean }) {
  const access = useBattleAccess();
  const links = access === "hidden" ? tabs : [...tabs, ["battle", access === "locked" ? "Unlock Battle" : "Battle"]];
  return (
    <>
    <nav
      aria-label="Content"
      className="mb-3 flex flex-wrap gap-1 border-b border-slate-700"
    >
      {links.map(([path, label]) => (
        <Link
          key={path}
          href={`/content/${path}`}
          onNavigate={confirmLeave && path !== active ? (event) => { if (!confirmLeave()) event.preventDefault(); } : undefined}
          aria-current={active === path ? "page" : undefined}
          className={`border-b-2 px-4 py-2 text-sm font-medium ${active === path ? "border-cyan-400 text-cyan-300" : "border-transparent text-slate-400 hover:text-cyan-300"}`}
        >
          {label}
        </Link>
      ))}
    </nav>
      {active !== "battle" && <ContentReloadPanel />}
    </>
  );
}
