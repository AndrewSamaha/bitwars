"use client";

import { useEffect, useState } from "react";
import type { PlayerPalette } from "@/lib/playerPalettes";
import { playerColorMaskCanvases } from "@/lib/playerColorMaskCanvas";
import { DEFAULT_PRIMARY_OPACITY, DEFAULT_SECONDARY_BRIGHTNESS_THRESHOLD, DEFAULT_SECONDARY_OPACITY } from "@/lib/playerColorSettings";

export default function MaskedSpritePreview({ baseUrl, primaryMaskUrl, invariantsMaskUrl, invariantColorsUrl, palette, className, primaryOpacity = DEFAULT_PRIMARY_OPACITY, secondaryOpacity = DEFAULT_SECONDARY_OPACITY, secondaryBrightnessThreshold = DEFAULT_SECONDARY_BRIGHTNESS_THRESHOLD, showPrimary = true, showSecondary = true }: {
  baseUrl: string;
  primaryMaskUrl: string;
  invariantsMaskUrl?: string | null;
  invariantColorsUrl?: string | null;
  palette: PlayerPalette;
  className: string;
  primaryOpacity?: number;
  secondaryOpacity?: number;
  secondaryBrightnessThreshold?: number;
  showPrimary?: boolean;
  showSecondary?: boolean;
}) {
  const [maskUrls, setMaskUrls] = useState<{ primary: string; secondary: string } | null>(null);
  useEffect(() => {
    let active = true;
    setMaskUrls(null);
    playerColorMaskCanvases(baseUrl, primaryMaskUrl, secondaryBrightnessThreshold, invariantsMaskUrl).then(({ primary, secondary }) => {
      if (active) setMaskUrls({ primary: primary.toDataURL("image/png"), secondary: secondary.toDataURL("image/png") });
    }).catch((error) => console.warn("Unable to preview secondary player color", error));
    return () => { active = false; };
  }, [baseUrl, primaryMaskUrl, secondaryBrightnessThreshold, invariantsMaskUrl]);

  return <div aria-label={`Sprite with ${palette.name} player colors`} className={`relative aspect-square ${className}`} role="img">
    <img alt="" className="absolute inset-0 size-full object-contain" src={baseUrl} />
    {invariantColorsUrl && <img alt="" className="absolute inset-0 size-full object-contain" src={invariantColorsUrl} />}
    {showSecondary && maskUrls && <div className="absolute inset-0" style={{
      backgroundColor: palette.secondary,
      opacity: secondaryOpacity,
      maskImage: `url("${maskUrls.secondary}")`,
      WebkitMaskImage: `url("${maskUrls.secondary}")`,
      maskSize: "100% 100%",
      WebkitMaskSize: "100% 100%",
      maskMode: "alpha",
    }} />}
    {showPrimary && maskUrls && <div className="absolute inset-0" style={{
      backgroundColor: palette.primary,
      opacity: primaryOpacity,
      maskImage: `url("${maskUrls.primary}")`,
      WebkitMaskImage: `url("${maskUrls.primary}")`,
      maskSize: "100% 100%",
      WebkitMaskSize: "100% 100%",
      maskMode: "alpha",
    }} />}
  </div>;
}
