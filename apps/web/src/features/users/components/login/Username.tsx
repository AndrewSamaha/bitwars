"use client"

import { Input } from "@/components/ui/input";
import { useFormContext } from "react-hook-form";

export default function Username() {
  const { register } = useFormContext();
  return (
    <Input
      id="username"
      placeholder="Enter your username"
      className="bg-input border-border"
      {...register("name")}
    />
  );
}
