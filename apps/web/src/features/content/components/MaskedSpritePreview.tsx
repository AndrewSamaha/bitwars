import type { PlayerPalette } from "@/lib/playerPalettes";

export default function MaskedSpritePreview({ baseUrl, primaryMaskUrl, secondaryMaskUrl, palette, className, showPrimary = true, showSecondary = true }: {
  baseUrl: string;
  primaryMaskUrl: string;
  secondaryMaskUrl: string;
  palette: PlayerPalette;
  className: string;
  showPrimary?: boolean;
  showSecondary?: boolean;
}) {
  return <div aria-label={`Sprite with ${palette.name} player colors`} className={`relative aspect-square ${className}`} role="img">
    <img alt="" className="absolute inset-0 size-full object-contain" src={baseUrl} />
    {([
      [primaryMaskUrl, palette.primary, showPrimary],
      [secondaryMaskUrl, palette.secondary, showSecondary],
    ] as const).map(([maskUrl, color, visible]) => visible && <div className="absolute inset-0" key={maskUrl} style={{
      backgroundColor: color,
      maskImage: `url("${maskUrl}")`,
      WebkitMaskImage: `url("${maskUrl}")`,
      maskSize: "100% 100%",
      WebkitMaskSize: "100% 100%",
      maskMode: "alpha",
    }} />)}
  </div>;
}
