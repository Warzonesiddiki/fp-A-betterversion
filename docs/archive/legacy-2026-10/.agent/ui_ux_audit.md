# UI/UX audit (sess_031) — honest, partial

Lighthouse / axe-on-every-route / 10k-row grid benches were **not** run this session (K11: 2 cores / 3 GB; W0.8 outranks chrome).

## Measured

| Item | Today |
| --- | --- |
| Lazy routes | 193 |
| Command palette | Present, permission-filtered, wired to NAV_SECTIONS |
| Skip links | 2 (main, nav) |
| Financial context bar | Scope / time / version / currency / freshness + Draft badge |
| Durability honesty (W0.8.5) | `DurabilityBanner` on AppLayout: local-only ledger, not a backup |
| Design tokens | CSS variables in `src/index.css` (navy/emerald/warning). Hardcoded colours remain in older pages |
| Four states | Incomplete. Empty-state work landed on many W0.1.1 pages; not 100% of 203 pages |
| Keyboard | Palette (⌘K), skip links, native form controls in context bar. Grid Excel-parity incomplete |
| Mobile | Modelling is a declared non-goal (§9.10). Exec dashboards not separately verified at 320px this session |

## Grade vs Part IV of FINAL_PROMPT

The Ledger design system is **specified**, partially **tokenized**, not **enforced**. Navigation is the largest UVI defect (W0.5). Do not start a visual rewrite while tenancy and the runtime three-statement gate are open.
