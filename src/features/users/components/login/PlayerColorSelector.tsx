"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { use } from "react";
import { type SuggestedLoginDetails } from "@/features/users/schema/player/suggestedLoginDetails";

export default function PlayerColorSelector({ suggestedLoginDetailsPromise }: { suggestedLoginDetailsPromise: Promise<SuggestedLoginDetails> }) {
  const suggestedLoginDetails = use(suggestedLoginDetailsPromise);
  const availableColors = suggestedLoginDetails?.availableColors ?? [];
  return (
    <Select value={availableColors[0]} onValueChange={(value) => console.log(value)}>
      <SelectTrigger className="bg-input border-border">
        <SelectValue placeholder="Select your color" />
      </SelectTrigger>
      <SelectContent>
        {availableColors.map((color) => (
          <SelectItem key={color} value={color}>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${color}`} />
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
