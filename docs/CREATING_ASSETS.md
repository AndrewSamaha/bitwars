# ASSETS
Sprites live in `apps/web/public/assets/<entity_type_id>/idle.png`
Generally, sprites should be 192x192 with centered content and a transparent background.
After adding a new sprite, you may need to run `pnpm -C packages/content build`, reset the game state (e.g., `pnpm game:reset` and restart the server+client). We do not yet have a clean path for hot loading new sprites into an existing game.

## Generating sprite candidates

`/content/sprites` is a local review workflow for making an original sprite
from a short art brief. Pick the target entity, optionally select up to three
existing BitWars sprites as style references, and generate up to four
candidates. Candidates are stored locally under
`packages/content/art-candidates/` (and are ignored by Git). Selecting **Use
this sprite** copies that PNG into the same runtime and content asset locations
used by the existing upload control.

Reference strength controls whether selected sprites are sent to the image
provider: **Style only** keeps them as prompt-level cues for greater variety,
while **Visual reference** and **Close iteration** upload them for increasing
fidelity. Qwen candidates also receive and record distinct random seeds.
Choose its requested square resolution from 192, 256, or 1024 pixels, and a
whole-number Qwen step count from 1 through 100 (default 40).

Set `OPENAI_API_KEY` in `.env` before using it. `OPENAI_IMAGE_MODEL` is
optional and defaults to `gpt-image-2.5-flare`.

The provider picker also supports the local Qwen LAN API. It defaults to
`http://192.168.1.11:8091`; set `QWEN_IMAGE_API_URL` in `.env` to use another
host. Qwen needs no API key in this local configuration.
