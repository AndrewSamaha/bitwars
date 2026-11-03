# Codex with Nemotron Lightning 3.5 through Fireworks

The project's Codex MCP configuration already exposes `bitwars_game_query` and
`bitwars_player`. The launcher below keeps the normal Codex default unchanged
and selects Fireworks' serverless
`accounts/fireworks/models/nemotron-lightning-3p5-30b-a3b` model for one session.

## Prerequisite

Configure the `fireworks-ai` provider once. The Nexus CLI does this with:

```bash
nexus codex
nexus codex status
```

The provider must use the Fireworks Responses API at
`https://api.fireworks.ai/inference/v1` and authenticate with a Fireworks key.
A minimal standalone provider definition is:

```toml
[model_providers.fireworks-ai]
name = "Fireworks"
base_url = "https://api.fireworks.ai/inference/v1"
env_key = "FIREWORKS_API_KEY"
wire_api = "responses"
```

## Run

From the repository root, start an interactive session with:

```bash
scripts/codex-nemotron.sh
```

Run a non-interactive experiment with the usual `codex exec` options:

```bash
scripts/codex-nemotron.sh exec \
  --ephemeral \
  --sandbox workspace-write \
  "Inspect the current game with bitwars_game_query. Describe the opening state and propose three resource strategies. Do not change the game."
```

The launcher loads
[`scripts/codex-nemotron-model-catalog.json`](../../scripts/codex-nemotron-model-catalog.json)
so Codex knows the model's 262,144-token context, text-only input, tool support,
and reasoning levels. It passes the short serverless model ID because Fireworks
accepts it and it matches the Codex catalog entry.

If the Fireworks provider has a different ID in your Codex config, override it:

```bash
FIREWORKS_CODEX_PROVIDER=fireworks-ai scripts/codex-nemotron.sh
```

## Game access

Use `bitwars_game_query` for read-only inspection. Use `bitwars_player` only
when the experiment is authorized to join and mutate a disposable game. Both
MCP servers are defined in the repository's `.codex/config.toml`; the game web
app must be reachable at the configured `BITWARS_GAME_QUERY_BASE_URL` or
`BITWARS_PLAYER_MCP_BASE_URL`.

## Why Nexus does not list the model

Nexus registers the serverless catalog filtered to its `coding` use case. The
all-models Fireworks catalog includes Nemotron Lightning 3.5, but the coding
filter does not. The launcher bypasses that curated picker without bypassing
the Fireworks endpoint.

## Other harnesses

OpenCode and Cline both support custom OpenAI-compatible providers and MCP.
OpenCode is the closest terminal alternative:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "fireworks": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Fireworks AI",
      "options": {
        "baseURL": "https://api.fireworks.ai/inference/v1",
        "apiKey": "{env:FIREWORKS_API_KEY}"
      },
      "models": {
        "accounts/fireworks/models/nemotron-lightning-3p5-30b-a3b": {
          "name": "Nemotron Lightning 3.5 30B A3B",
          "limit": { "context": 262144, "output": 32768 }
        }
      }
    }
  }
}
```

In Cline, select **OpenAI Compatible**, use the same base URL and model ID, set
the context limit to 262,144, and enable tool/function calling. Add the
Bitwars player MCP server through Cline's MCP settings when using either
alternative.
