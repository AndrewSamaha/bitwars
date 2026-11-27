import type { ReactNode } from "react";
import { BattleNavigation } from "@/features/content/battle/BattleNavigation";
import { developerConfig, developerOwner } from "@/lib/content/battle/access";

export default async function ContentLayout({ children }: { children: ReactNode }) {
  const config = developerConfig();
  const access = !config ? "hidden" : await developerOwner(config) ? "unlocked" : "locked";
  return <BattleNavigation access={access}>{children}</BattleNavigation>;
}
