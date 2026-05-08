# `prompts/` — System & task prompts

Plain-text / markdown prompt templates fed to the Groq LLM.

Suggested layout:

- `system.md` — global system prompt that defines the assistant persona.
- `intent-detection.md` — prompt used by `app/api/analyze/` to classify the user's intent.
- `ui-generation.md` — prompt used by `app/api/generate-ui/` to emit a JSON UI spec.
- `templates/` (optional) — per-use-case prompt fragments (travel, roadmap, fitness).

Keep prompts in version control so changes are reviewable.
