# `app/components/` — Client UI Components

Reusable React components rendered on the client. All files in this folder
should start with `"use client"` unless they are intentionally server-only.

## `templates/`

Generative UI templates — one component per supported use case
(travel itinerary, dev roadmap, fitness plan, …). Each template accepts a
typed JSON spec produced by `app/api/generate-ui/` and renders the final UI.
