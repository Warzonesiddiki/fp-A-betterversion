---
id: MEMORY/SCHEMA/ENV.md
status: active
last_verified: 2026-08-18
verified_by: arena-agent/session-017
confidence: high
---

# SCHEMA/ENV — variable NAMES only

`.env.example` states the app is offline-first: no `.env` is committed, no external service, no
API keys by default.

| Name | Purpose | Required? |
| --- | --- | --- |
| `VITE_SENTRY_DSN` | Self-hosted Sentry DSN. Empty/unset ⇒ `Sentry.init()` is skipped. | No |
| `VITE_SENTRY_RELEASE` | Release tag for Sentry events. | No |

Session-replay masking is **unconditional** in `src/sentryReplayConfig.ts` and deliberately not
env-configurable. Never add a variable that gates privacy.

No secrets, tokens or real values may ever be written into MEMORY.
