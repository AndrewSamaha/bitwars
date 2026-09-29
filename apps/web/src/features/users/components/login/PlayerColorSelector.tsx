"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Controller, useFormContext } from "react-hook-form";
import { useSuggestedLoginDetails } from "./LoginFormContext";
import { PLAYER_PALETTES } from "@/lib/playerPalettes";

export default function PlayerColorSelector() {
  const { control } = useFormContext();
  const suggested = useSuggestedLoginDetails();
  const availableColors = suggested?.availableColors ?? [];
  return (
    <Controller
      name="color"
      control={control}
      render={({ field: { value, onChange } }) => (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="bg-input border-border">
            <SelectValue placeholder="Select your color" />
          </SelectTrigger>
          <SelectContent>
            {availableColors.map((color) => {
              const palette = PLAYER_PALETTES.find((item) => item.id === color);
              if (!palette) return null;
              return <SelectItem key={color} value={color}>
                <div className="flex items-center gap-2">
                  <div className="size-4 rounded-full" style={{ backgroundColor: palette.primary }} />
                  <div className="size-4 rounded-full" style={{ backgroundColor: palette.secondary }} />
                  <span>{palette.name}</span>
                </div>
              </SelectItem>;
            })}
          </SelectContent>
        </Select>
      )}
    />
  );
}
