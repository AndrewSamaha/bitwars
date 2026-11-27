"use client";

import { createContext, useContext, type ReactNode } from "react";

type Access = "hidden" | "locked" | "unlocked";
const BattleAccess = createContext<Access>("hidden");

export function BattleNavigation({ access, children }: { access: Access; children: ReactNode }) {
  return <BattleAccess.Provider value={access}>{children}</BattleAccess.Provider>;
}

export function useBattleAccess() {
  return useContext(BattleAccess);
}
