# ASSETS
Sprites live in `apps/web/public/assets/<entity_type_id>/idle.png`
Generally, sprites should be 192x192 with centered content and a transparent background.
After adding a new sprite, you may need to run `pnpm -C packages/content build`, reset the game state (e.g., `pnpm reset:game` and restart the server+client). We do not yet have a clean path for hot loading new sprites into an existing game.
