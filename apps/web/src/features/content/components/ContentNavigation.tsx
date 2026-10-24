"use client";
import Link from "next/link";

const tabs = [
  ["entities", "Entities"],
  ["techtree", "Techtree"],
  ["sprite-library", "Sprites"],
  ["sfx", "SFX"],
  ["scenarios", "Scenarios"],
  ["spawn", "Spawn"],
  ["balance", "Balance"],
];
export default function ContentNavigation({ active }: { active: string }) {
  return (
    <nav
      aria-label="Content"
      className="mb-3 flex flex-wrap gap-1 border-b border-slate-700"
    >
      {tabs.map(([path, label]) => (
        <Link
          key={path}
          href={`/content/${path}`}
          aria-current={active === path ? "page" : undefined}
          className={`border-b-2 px-4 py-2 text-sm font-medium ${active === path ? "border-cyan-400 text-cyan-300" : "border-transparent text-slate-400 hover:text-cyan-300"}`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
