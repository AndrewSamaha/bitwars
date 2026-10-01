"use client";

import { useEffect, useState } from "react";
import type { PlayerPalette } from "@/lib/playerPalettes";
import { playerColorMaskCanvases } from "@/lib/playerColorMaskCanvas";
import { DEFAULT_PRIMARY_OPACITY, DEFAULT_SECONDARY_BRIGHTNESS_THRESHOLD, DEFAULT_SECONDARY_OPACITY } from "@/lib/playerColorSettings";

export default function MaskedSpritePreview({ baseUrl, primaryMaskUrl, palette, className, primaryOpacity = DEFAULT_PRIMARY_OPACITY, secondaryOpacity = DEFAULT_SECONDARY_OPACITY, secondaryBrightnessThreshold = DEFAULT_SECONDARY_BRIGHTNESS_THRESHOLD, showPrimary = true, showSecondary = true }: {
  baseUrl: string;
  primaryMaskUrl: string;
  palette: PlayerPalette;
  className: string;
  primaryOpacity?: number;
  secondaryOpacity?: number;
  secondaryBrightnessThreshold?: number;
  showPrimary?: boolean;
  showSecondary?: boolean;
}) {
  const [secondaryMaskUrl, setSecondaryMaskUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setSecondaryMaskUrl(null);
    playerColorMaskCanvases(baseUrl, primaryMaskUrl, secondaryBrightnessThreshold).then(({ secondary }) => {
      if (active) setSecondaryMaskUrl(secondary.toDataURL("image/png"));
    }).catch((error) => console.warn("Unable to preview secondary player color", error));
    return () => { active = false; };
  }, [baseUrl, primaryMaskUrl, secondaryBrightnessThreshold]);

  return <div aria-label={`Sprite with ${palette.name} player colors`} className={`relative aspect-square ${className}`} role="img">
    <img alt="" className="absolute inset-0 size-full object-contain" src={baseUrl} />
    {showSecondary && secondaryMaskUrl && <div className="absolute inset-0" style={{
      backgroundColor: palette.secondary,
      opacity: secondaryOpacity,
      maskImage: `url("${secondaryMaskUrl}")`,
      WebkitMaskImage: `url("${secondaryMaskUrl}")`,
      maskSize: "100% 100%",
      WebkitMaskSize: "100% 100%",
      maskMode: "alpha",
    }} />}
    {showPrimary && <div className="absolute inset-0" style={{
      backgroundColor: palette.primary,
      opacity: primaryOpacity,
      maskImage: `url("${primaryMaskUrl}")`,
      WebkitMaskImage: `url("${primaryMaskUrl}")`,
      maskSize: "100% 100%",
      WebkitMaskSize: "100% 100%",
      maskMode: "alpha",
    }} />}
  </div>;
}
