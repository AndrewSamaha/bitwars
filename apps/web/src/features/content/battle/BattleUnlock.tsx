"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function BattleUnlock({ origin }: { origin: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const key = new FormData(form).get("battleKey");
    if (typeof key !== "string" || !key) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/content/battle/session", { method: "POST", body: key, cache: "no-store" });
      if (!response.ok) throw new Error((await response.json()).message);
      form.reset();
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not unlock Battle. Retry.");
      setSubmitting(false);
    }
  }

  return <form className="mx-auto max-w-lg space-y-4 rounded border border-slate-700 bg-slate-900 p-6" onSubmit={submit}>
    <h1 className="text-xl font-semibold">Unlock Battle Sandbox</h1>
    <p className="text-sm text-slate-300">Use your local BATTLE_DEV_KEY at {origin}. A player login does not grant access.</p>
    <label className="block text-sm">Developer key
      <input name="battleKey" type="password" required maxLength={4096} autoComplete="off" className="mt-1 block w-full rounded border border-slate-600 bg-slate-950 p-2" />
    </label>
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
    <button disabled={submitting} className="rounded bg-cyan-800 px-4 py-2 disabled:opacity-60">{submitting ? "Unlocking…" : "Unlock Battle"}</button>
  </form>;
}