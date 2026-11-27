import { notFound } from "next/navigation";
import BattleEditor from "@/features/content/battle/BattleEditor";
import BattleUnlock from "@/features/content/battle/BattleUnlock";
import ContentNavigation from "@/features/content/components/ContentNavigation";
import { developerConfig, developerOwner } from "@/lib/content/battle/access";

export default async function BattlePage() {
  const config = developerConfig();
  if (!config) notFound();
  if (!await developerOwner(config)) return <main className="min-h-screen bg-slate-950 p-4 text-slate-100">
    <ContentNavigation active="battle" />
    <BattleUnlock origin={config.origin} />
  </main>;
  return <BattleEditor />;
}
