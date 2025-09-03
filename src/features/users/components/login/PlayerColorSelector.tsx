"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Controller, useFormContext } from "react-hook-form";
import { useSuggestedLoginDetails } from "./LoginFormContext";

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
            {availableColors.map((color) => (
              <SelectItem key={color} value={color}>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${color}`} />
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );
}
