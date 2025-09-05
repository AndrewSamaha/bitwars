"use client";

import { createContext, useContext } from "react";
import type { SuggestedLoginDetails } from "@/features/users/schema/player/suggestedLoginDetails";

export const SuggestedLoginDetailsContext = createContext<SuggestedLoginDetails | null>(null);

export function useSuggestedLoginDetails() {
  const ctx = useContext(SuggestedLoginDetailsContext);
  if (!ctx) {
    throw new Error("useSuggestedLoginDetails must be used within SuggestedLoginDetailsContext.Provider");
  }
  return ctx;
}
