# CEO Demo Video — Recording Runbook

> Goal: a ~90-second authentic desktop recording matching the simulation in
> `presentations/CEO_BRIEFING_2026-08-24.html` (slide “Expected result · live simulation”).
> Browsers are intentionally blocked by the Tauri-only gate, so record inside the desktop shell.

## Setup (one-time)

1. `npm run tauri:dev` — wait for the native window.
2. Seed demo data with the mock-data generator family (`npm run mock-data:*` scripts; scope per
   `scripts/mock-data-audit.mjs`).
3. OBS Studio → Settings: 1920×1080, 60 fps, capture **window**, disable cursor unless narrating.
4. Close notifications; set Windows focus-assist to off.

## Shot list (~90 s total)

| #   | Seconds | Action                                                             | Expected on-screen result                                                  |
| --- | ------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| 1   | 0–10    | GL import wizard: drop CSV with `1,234.56` amounts and mixed dates | Rows import; malformed dates surface as row errors, never stored garbage   |
| 2   | 10–25   | Budget: change headcount growth driver 4% → 6%                     | Downstream lines cascade instantly; totals recompute exact (no float dust) |
| 3   | 25–40   | Forecast: run Monte Carlo 100k iterations, then hit Cancel mid-run | Progress fires; cancel settles immediately (no stranded worker task)       |
| 4   | 40–55   | Scenario compare A/B on revenue −5% vs +8%                         | Side-by-side deltas colored by RAW sign (#16A34A green / #DC2626 red)      |
| 5   | 55–75   | Period close → hard-lock M07 → attempt line edit → undo            | Typed lock error surfaces; undo replay is blocked too                      |
| 6   | 75–90   | Board pack export → PDF + XLSX open                                | One-click export; variance chips use canonical palette                     |

## Narration captions

Reuse the three simulation captions verbatim from the deck so video and deck tell one story.

## Fallback

If a machine-dependent issue blocks recording before the meeting, present the deck’s animated
simulation slide — it plays the identical storyboard without external tooling.

## Honesty note (repo law D-007)

The simulation slide is labeled as an interactive prototype simulation. Never present it as captured
footage of the shipped binary.
