// Shared HUD layout constants to keep overlays coordinated

// Terminal widths (in rem) matching Tailwind classes used in TerminalPanel
// - w-96 => 24rem
// - w-12 => 3rem
export const TERMINAL_WIDTH_OPEN_REM = 24;
export const TERMINAL_WIDTH_CLOSED_REM = 3;

// Margins/gutters (in rem) matching Tailwind spacing
// - left-4 => 1rem
// - gutter between Terminal and other panels => 1rem
export const TERMINAL_MARGIN_LEFT_REM = 1;
export const PANEL_GUTTER_REM = 1;

// Compute the effective left offset for panels that should not overlap the terminal
export function getEntityDetailLeftOffset(isTerminalOpen: boolean): number {
  const terminalWidth = isTerminalOpen ? TERMINAL_WIDTH_OPEN_REM : TERMINAL_WIDTH_CLOSED_REM;
  return TERMINAL_MARGIN_LEFT_REM + terminalWidth + PANEL_GUTTER_REM;
}
