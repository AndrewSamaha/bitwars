"use client"

import { Input } from "@/components/ui/input";
import { use } from "react";
import { type SuggestedLoginDetails } from "@/features/users/schema/player/suggestedLoginDetails";

export default function Username({ suggestedLoginDetailsPromise }: { suggestedLoginDetailsPromise: Promise<SuggestedLoginDetails> }) {
  const suggestedLoginDetails = use(suggestedLoginDetailsPromise);
  return (
    <Input
                  id="username"
                  placeholder="Enter your username"
                  value={suggestedLoginDetails?.suggestedName}
                  onChange={(e) => (console.log(e.target.value))}
                  className="bg-input border-border"
                />
  );
}
