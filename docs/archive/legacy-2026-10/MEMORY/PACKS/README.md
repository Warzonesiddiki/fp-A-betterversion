---
id: MEMORY/PACKS/README.md
status: active
last_verified: 2026-08-18
verified_by: arena-agent/session-017
confidence: medium
---

# PACKS — industry vertical packs

**Rule (K19): a vertical pack must not fork the core engine.** A pack may add account mappings,
KPI definitions, report layouts and terminology. It may not add its own money math.

Vertical surfaces that exist on disk today (verified as page directories under `src/pages/`):
healthcare, insurance, construction, retail, real estate (REIT), education, government, logistics,
energy, ESG, plus sector engines under `src/engines/`.

Status: most vertical pages are being audited for fabrication one at a time. Several sector
engines still carry invented constants — see `MEMORY/PRODUCT/GAPS.md` and `MEMORY/MAP/MODULES.md`
(`flagged`). Do not treat a vertical page as trustworthy because it renders.
