# CANONICAL PROJECT TREE (Part LXI)

> **Source of authority:** OMNI-SOVEREIGN CODEX, Addendum II, Part LXI.
> **Status:** normative target tree for **OmniPlan**. Reproduced verbatim from the Codex.
> **Written at:** blueprint lock, 2026-08-17 (Section 22, Article XVIII-N).
>
> This is the **target** tree, not the current repository layout. It is filled in phase
> order per `.agent/BLUEPRINT.md` Section 18. Directories and `README.md` stubs are
> created as their phase begins — creating 600 empty directories at lock would be
> ceremony, not engineering.
>
> **Sync rule:** this file and the repository must not silently diverge. When a phase
> lands a directory, it lands here in the same pull request. Generated artifacts remain
> generated and are not listed as source. Agent memory lives under `/.agent`.
>
> **Deviations from this tree that are already decided** (see `.agent/BLUEPRINT.md`
> Section 21, ADR-003) are recorded at the bottom of this file under
> _"Known deviations"_. The tree below is reproduced unmodified so that future cycles
> compare against the original, not against a quietly edited copy.

---

## The tree (Part LXI, verbatim)

```
omniplan/
│
├── .agent/                                      # KERNEL memory (committed except backups)
│   ├── BLUEPRINT.md
│   ├── BLUEPRINT_GAPS.md
│   ├── FINANCIAL_RULES.md
│   ├── INDUSTRY_PACKS.md
│   ├── ERROR_CODES.md
│   ├── METRIC_REGISTRY.md
│   ├── SOD_MATRIX.md
│   ├── CALENDARS.md
│   ├── PROJECT_JOURNAL.md
│   ├── state.json
│   ├── action_log.jsonl
│   ├── index/
│   └── backups/                                 # gitignored
│
├── .github/
│   ├── CODEOWNERS
│   ├── dependabot.yml
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_financial.yml                    # Sev-0 template
│   │   ├── feature.yml
│   │   └── connector.yml
│   └── workflows/
│       ├── ci.yml                               # lint, type, unit, contract
│       ├── financial-assertions.yml             # blocking
│       ├── rls.yml                              # tenant isolation tests
│       ├── precision-static.yml                 # no float in money paths
│       ├── e2e.yml
│       ├── visual-regression.yml
│       ├── load-nightly.yml
│       ├── sbom.yml
│       ├── codeql.yml
│       ├── sca.yml
│       ├── container-scan.yml
│       ├── iac-scan.yml
│       ├── secret-scan.yml
│       ├── license-check.yml
│       ├── migrate-preview.yml
│       └── release.yml                          # semver + changelog
│
├── .husky/                                      # or leftover hooks — honor existing
├── .vscode/                                     # recommended extensions + debug
├── .devcontainer/devcontainer.json
├── docker-compose.yml                           # api, web, worker, postgres, redis, minio
├── docker-compose.e2e.yml
├── Makefile                                     # one-command setup
├── justfile
├── turbo.json                                   # or nx/pnpm workspaces
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
├── .editorconfig
├── .prettierrc
├── eslint.config.js
├── commitlint.config.js
├── LICENSE
├── NOTICE
├── SECURITY.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── CHANGELOG.md
├── README.md
│
├── docs/
│   ├── architecture/
│   │   ├── TREE.md                              # this tree, kept in sync
│   │   ├── C4-context.md
│   │   ├── C4-container.md
│   │   ├── C4-calc-engine.md
│   │   ├── data-model.md
│   │   ├── lineage.md
│   │   ├── cqrs-cubes.md
│   │   └── threat-model.md
│   ├── adr/                                     # ADR-0001…
│   ├── api/
│   │   ├── openapi.yaml
│   │   └── asyncapi.yaml
│   ├── runbooks/
│   │   ├── sev0-three-statement.md
│   │   ├── failover-postgres.md
│   │   ├── connector-poison.md
│   │   ├── key-rotation.md
│   │   └── region-pin-restore.md
│   ├── security/
│   │   ├── sod.md
│   │   ├── rls.md
│   │   ├── retention.md
│   │   └── subprocessors.md
│   ├── finance/
│   │   ├── three-statement.md
│   │   ├── ias21.md
│   │   ├── ias29.md
│   │   ├── asc606.md
│   │   ├── asc842.md
│   │   └── consolidations.md
│   ├── implementation/
│   │   ├── day-14.md
│   │   ├── excel-deconstruction.md
│   │   └── anaplan-exit.md
│   └── academy/
│       ├── cfo.md
│       ├── analyst.md
│       └── admin.md
│
├── infra/
│   ├── terraform/
│   │   ├── modules/
│   │   │   ├── network/
│   │   │   ├── postgres/
│   │   │   ├── redis/
│   │   │   ├── kafka-or-nats/
│   │   │   ├── object-store/
│   │   │   ├── kms/
│   │   │   ├── eks-or-gke-or-aks/
│   │   │   ├── observability/
│   │   │   └── edge-waf/
│   │   ├── envs/
│   │   │   ├── dev/
│   │   │   ├── uat/
│   │   │   ├── prod-us/
│   │   │   ├── prod-eu/
│   │   │   └── prod-apac/
│   │   └── tenants/                             # single-tenant VPC instantiations
│   ├── helm/omniplan/
│   ├── pulumi/                                  # only if stack fingerprint chooses it
│   └── policies/
│       ├── opa/
│       └── sentinel-or-conftest/
│
├── ops/
│   ├── grafana/dashboards/
│   ├── prometheus/rules/                        # SLO burn
│   ├── otel/collector.yaml
│   ├── alerts/pager.yaml
│   └── statuspage/
│
├── apps/
│   ├── web/                                     # Next.js App Router
│   │   ├── app/
│   │   │   ├── (public)/                        # marketing, legal, status
│   │   │   │   ├── page.tsx
│   │   │   │   ├── pricing/
│   │   │   │   ├── security/
│   │   │   │   ├── legal/
│   │   │   │   │   ├── privacy/
│   │   │   │   │   ├── terms/
│   │   │   │   │   └── dpa/
│   │   │   │   └── status/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   ├── sso/
│   │   │   │   ├── mfa/
│   │   │   │   └── invite/
│   │   │   └── (app)/
│   │   │       ├── layout.tsx                   # sidebar + command palette
│   │   │       ├── home/
│   │   │       ├── planning/
│   │   │       │   ├── budget/
│   │   │       │   ├── forecast/
│   │   │       │   ├── long-range/
│   │   │       │   ├── zero-based/
│   │   │       │   └── scenarios/
│   │   │       ├── actuals/
│   │   │       │   ├── flash/
│   │   │       │   ├── variance/
│   │   │       │   └── flux/
│   │   │       ├── close/
│   │   │       │   ├── calendar/
│   │   │       │   ├── tasks/
│   │   │       │   ├── reconciliations/
│   │   │       │   ├── journals/
│   │   │       │   └── certify/
│   │   │       ├── consolidation/
│   │   │       │   ├── hierarchy/
│   │   │       │   ├── eliminations/
│   │   │       │   ├── ic-matching/
│   │   │       │   ├── nci/
│   │   │       │   └── fx-translation/
│   │   │       ├── headcount/
│   │   │       ├── compensation/
│   │   │       ├── capex/
│   │   │       ├── revenue/
│   │   │       │   ├── planning/
│   │   │       │   ├── revrec/
│   │   │       │   └── cohorts/
│   │   │       ├── profitability/
│   │   │       ├── working-capital/
│   │   │       ├── treasury/
│   │   │       │   ├── cash-position/
│   │   │       │   ├── cash-forecast/
│   │   │       │   ├── debt/
│   │   │       │   └── covenants/
│   │   │       ├── tax/
│   │   │       ├── leases/
│   │   │       ├── sbc/
│   │   │       ├── esg/
│   │   │       ├── deals/
│   │   │       │   ├── pipeline/
│   │   │       │   ├── models/
│   │   │       │   ├── vdr/
│   │   │       │   └── impairment/
│   │   │       ├── reports/
│   │   │       │   ├── dashboards/
│   │   │       │   ├── builder/
│   │   │       │   ├── board-pack/
│   │   │       │   ├── statutory/
│   │   │       │   └── investor/
│   │   │       ├── metrics/                     # metric store UI
│   │   │       ├── models/                      # model git-like UI
│   │   │       ├── workflow/
│   │   │       ├── inbox/                       # my tasks / approvals
│   │   │       ├── search/
│   │   │       ├── academy/
│   │   │       ├── admin/
│   │   │       │   ├── tenant/
│   │   │       │   ├── entities/
│   │   │       │   ├── coa/
│   │   │       │   ├── dimensions/
│   │   │       │   ├── calendars/
│   │   │       │   ├── books/
│   │   │       │   ├── fx-rates/
│   │   │       │   ├── mappings/
│   │   │       │   ├── integrations/
│   │   │       │   ├── identity/
│   │   │       │   ├── sod/
│   │   │       │   ├── entitlements/
│   │   │       │   ├── residency/
│   │   │       │   └── audit-log/
│   │   │       └── settings/
│   │   │           ├── profile/
│   │   │           ├── notifications/
│   │   │           └── appearance/
│   │   ├── components/                          # app-specific compositions
│   │   ├── public/
│   │   └── tests/
│   │
│   ├── api/                                     # Fastify or FastAPI — pick at B5
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── http/
│   │   │   │   ├── routes/
│   │   │   │   │   ├── auth/
│   │   │   │   │   ├── tenants/
│   │   │   │   │   ├── facts/
│   │   │   │   │   ├── journals/
│   │   │   │   │   ├── calc/
│   │   │   │   │   ├── consol/
│   │   │   │   │   ├── reports/
│   │   │   │   │   ├── integrations/
│   │   │   │   │   ├── workflow/
│   │   │   │   │   ├── search/
│   │   │   │   │   ├── ai/
│   │   │   │   │   ├── exports/
│   │   │   │   │   ├── scim/
│   │   │   │   │   └── webhooks/
│   │   │   │   ├── middleware/
│   │   │   │   │   ├── rls-context.ts
│   │   │   │   │   ├── entitlements.ts
│   │   │   │   │   ├── step-up.ts
│   │   │   │   │   ├── idempotency.ts
│   │   │   │   │   ├── rate-limit.ts
│   │   │   │   │   └── audit.ts
│   │   │   │   └── errors/
│   │   │   ├── graphql-or-trpc/                 # if chosen — one public contract
│   │   │   └── ws/                              # presence, calc progress
│   │   └── tests/
│   │
│   ├── worker/                                  # BullMQ / Celery
│   │   ├── src/
│   │   │   ├── queues/
│   │   │   │   ├── calc.queue.ts
│   │   │   │   ├── import.queue.ts
│   │   │   │   ├── export.queue.ts
│   │   │   │   ├── connector.queue.ts
│   │   │   │   ├── cube-refresh.queue.ts
│   │   │   │   ├── notify.queue.ts
│   │   │   │   ├── pdf.queue.ts
│   │   │   │   ├── ml.queue.ts
│   │   │   │   └── purge.queue.ts               # respects legal hold
│   │   │   └── processors/
│   │   └── tests/
│   │
│   ├── scheduler/                               # close calendars, rolling jobs
│   ├── realtime/                                # presence / collaboration authority
│   ├── calc-service/                            # extracted in Phase 2 if load proves
│   ├── integration-hub/                         # extracted in Phase 2
│   ├── excel-addin/                             # Office.js
│   ├── sheets-addon/
│   ├── slack-bot/
│   ├── teams-app/
│   ├── mobile/                                  # RN or Flutter — Phase 2
│   ├── embed/                                   # embed SDK demo host
│   └── marketing-site/                          # optional split
│
├── packages/
│   ├── kernel-config/                           # feature flags vs entitlements schema
│   ├── shared-types/                            # branded Decimal, Currency, PeriodId
│   ├── shared-utils/
│   ├── i18n/
│   │   ├── catalogs/
│   │   └── formula-aliases/
│   ├── design-tokens/                           # Ledger tokens
│   ├── ui/                                      # shadcn-based primitives
│   │   ├── button/
│   │   ├── dialog/
│   │   ├── command-palette/
│   │   ├── toast/
│   │   └── a11y/
│   ├── grid/                                    # AG Grid wrappers + excel keymap
│   │   ├── formula-bar/
│   │   ├── editors/
│   │   ├── formatters/
│   │   ├── selection/
│   │   ├── undo-stack/
│   │   ├── print/
│   │   └── a11y/
│   ├── charts/                                  # waterfall, tornado, cohort…
│   ├── pdf/                                     # board pack renderer
│   ├── pptx/
│   ├── xlsx-io/
│   ├── brand-kit/
│   │
│   ├── db/
│   │   ├── schema/
│   │   │   ├── 000_tenancy.sql
│   │   │   ├── 010_identity.sql
│   │   │   ├── 020_mdm.sql
│   │   │   ├── 030_time.sql
│   │   │   ├── 040_facts.sql
│   │   │   ├── 050_journals.sql
│   │   │   ├── 060_workflow.sql
│   │   │   ├── 070_lineage.sql
│   │   │   ├── 080_metrics.sql
│   │   │   ├── 090_integrations.sql
│   │   │   ├── 100_audit.sql
│   │   │   ├── 110_notifications.sql
│   │   │   ├── 120_entitlements.sql
│   │   │   ├── 130_ai.sql
│   │   │   ├── 140_esg.sql
│   │   │   ├── 150_treasury.sql
│   │   │   ├── 160_revrec.sql
│   │   │   ├── 170_leases.sql
│   │   │   ├── 180_tax.sql
│   │   │   ├── 190_deals.sql
│   │   │   └── 200_rls_policies.sql
│   │   ├── migrations/
│   │   ├── seeds/
│   │   │   ├── demo-saas/
│   │   │   ├── demo-manufacturing/
│   │   │   └── …
│   │   └── tests/rls/
│   │
│   ├── financial-engine/                        # THE sacred package
│   │   ├── precision/                           # decimal only
│   │   ├── rounding/
│   │   ├── sign-conventions/
│   │   ├── three-statement/
│   │   ├── assertions/
│   │   └── benches/
│   ├── formula-parser/
│   │   ├── lexer/
│   │   ├── ast/
│   │   ├── excel-compat/
│   │   └── functions/                           # one file per function family
│   ├── calc-graph/                              # DAG, incremental dirty set
│   ├── calc-wasm/                               # Rust/WASM hot paths
│   ├── fx-engine/                               # IAS 21 / optional IAS 29
│   ├── consolidation/
│   │   ├── methods/                             # full, equity, proportionate
│   │   ├── eliminations/
│   │   ├── nci/
│   │   └── cta/
│   ├── allocation-engine/
│   ├── scenario-engine/
│   ├── forecast-engine/                         # stat methods, not ML
│   ├── variance-engine/
│   ├── cashflow-engine/
│   ├── capex-engine/
│   ├── headcount-engine/
│   ├── profitability-engine/
│   ├── working-capital-engine/
│   ├── covenant-engine/
│   ├── debt-engine/
│   ├── lease-engine/
│   ├── sbc-engine/
│   ├── revrec-engine/
│   ├── tax-engine/
│   ├── esg-engine/
│   ├── impairment-engine/
│   ├── ic-matching/
│   ├── reconciliation-engine/
│   ├── journal-engine/
│   ├── restatement/
│   ├── validation-engine/
│   │
│   ├── metric-store/
│   ├── semantic-planner/
│   ├── cube/                                    # aggregate navigator
│   ├── lineage-graph/
│   ├── mdm/
│   ├── calendars/
│   ├── books/
│   │
│   ├── workflow-sm/                             # xstate machines
│   │   ├── budget.machine.ts
│   │   ├── close.machine.ts
│   │   ├── rec.machine.ts
│   │   └── deal.machine.ts
│   ├── notifications/
│   ├── search/
│   ├── udf-sandbox/                             # Wasmtime / worker
│   ├── collaboration/                           # CRDT comments + cell leases
│   ├── entitlements/
│   ├── metering/
│   ├── billing-adapter/
│   │
│   ├── identity/
│   │   ├── oidc/
│   │   ├── saml/
│   │   ├── scim/
│   │   ├── sod/
│   │   └── step-up/
│   ├── rls/
│   ├── masking/
│   ├── audit/
│   ├── kms/
│   ├── residency/
│   ├── dlp/
│   │
│   ├── integrations/
│   │   ├── core/                                # adapter interface, inbox/outbox
│   │   ├── mapping/
│   │   ├── recon/
│   │   ├── erp/
│   │   │   ├── netsuite/
│   │   │   ├── sap-s4/
│   │   │   ├── sap-ecc/
│   │   │   ├── oracle-fusion/
│   │   │   ├── oracle-ebs/
│   │   │   ├── dynamics-365/
│   │   │   ├── workday-financials/
│   │   │   ├── quickbooks/
│   │   │   ├── xero/
│   │   │   ├── sage-intacct/
│   │   │   └── freshbooks/
│   │   ├── crm/
│   │   │   ├── salesforce/
│   │   │   ├── hubspot/
│   │   │   └── pipedrive/
│   │   ├── hris/
│   │   │   ├── workday/
│   │   │   ├── bamboohr/
│   │   │   ├── adp/
│   │   │   ├── rippling/
│   │   │   └── gusto/
│   │   ├── billing/
│   │   │   ├── stripe/
│   │   │   ├── zuora/
│   │   │   ├── chargebee/
│   │   │   └── recurly/
│   │   ├── banks/
│   │   │   ├── plaid/
│   │   │   └── file-camt053/
│   │   ├── warehouse/
│   │   │   ├── snowflake/
│   │   │   ├── bigquery/
│   │   │   ├── redshift/
│   │   │   └── databricks/
│   │   ├── files/
│   │   │   ├── csv/
│   │   │   ├── xlsx/
│   │   │   └── parquet/
│   │   ├── fx/
│   │   │   ├── ecb/
│   │   │   └── openexchangerates/
│   │   ├── market-data/                         # Phase 3
│   │   ├── ipaas/
│   │   │   ├── zapier/
│   │   │   ├── make/
│   │   │   └── workato/
│   │   └── office/
│   │       └── excel-live/
│   │
│   ├── migration-excel/                         # XXVIII deconstruction
│   ├── migration-anaplan/
│   ├── migration-adaptive/
│   │
│   ├── ai/
│   │   ├── forecast/                            # prophet/arima/ensemble
│   │   ├── anomaly/
│   │   ├── nlq/
│   │   │   ├── rules/
│   │   │   └── llm-planner/                     # schema only to LLM
│   │   ├── commentary/
│   │   ├── mapping-suggest/
│   │   ├── match-suggest/
│   │   └── guardrails/                          # no amounts egress
│   │
│   ├── vertical-packs/
│   │   ├── _sdk/                                # pack contract (kpis, coa, templates)
│   │   ├── saas/
│   │   │   ├── kpis.yaml                        # ARR, NRR, Rule40, magic number…
│   │   │   ├── coa_mapping.yaml
│   │   │   ├── templates/
│   │   │   ├── reports/
│   │   │   ├── terminology.yaml
│   │   │   ├── validation.yaml
│   │   │   └── onboarding.yaml
│   │   ├── financial-services-banking/
│   │   ├── financial-services-insurance/
│   │   ├── financial-services-am-pe/
│   │   ├── healthcare-providers/
│   │   ├── healthcare-life-sciences/
│   │   ├── manufacturing/
│   │   ├── retail-cpg/
│   │   ├── ecommerce/
│   │   ├── real-estate/
│   │   ├── construction/
│   │   ├── energy-oilandgas/
│   │   ├── energy-utilities/
│   │   ├── professional-services/
│   │   ├── nonprofit/
│   │   ├── public-sector/
│   │   ├── hospitality/
│   │   ├── travel-airlines/
│   │   ├── media-entertainment/
│   │   ├── telecom/
│   │   ├── education/
│   │   ├── agriculture/
│   │   ├── logistics/
│   │   ├── marketplace/
│   │   └── gaming/
│   │
│   ├── sdks/
│   │   ├── typescript/
│   │   └── python/
│   └── cli/                                     # omniplan dev, seed, assert
│
├── tools/
│   ├── seed/
│   ├── synth-data/                              # LIX
│   ├── benchmark/
│   │   ├── calc-1b.md                           # targets, not fantasies
│   │   └── grid-100k.ts
│   ├── formula-golden/                          # Excel twin fixtures
│   ├── shadow-run/                              # Excel vs OmniPlan diff
│   ├── lineage-viz/
│   ├── chaos/
│   │   ├── kill-worker.sh
│   │   └── partition-db.sh
│   └── codegen/
│       ├── openapi.ts
│       └── packs.ts
│
├── tests/
│   ├── unit/
│   ├── contract/
│   ├── integration/
│   ├── e2e/
│   │   ├── cfo-board-pack.spec.ts
│   │   ├── analyst-variance-drill.spec.ts
│   │   ├── controller-5-entity-consol.spec.ts
│   │   ├── admin-onboard-entity.spec.ts
│   │   └── sod-cannot-self-approve.spec.ts
│   ├── financial/
│   │   ├── three-statement.spec.ts
│   │   ├── ias21.spec.ts
│   │   ├── ic-zero.spec.ts
│   │   ├── allocation-100.spec.ts
│   │   ├── precision-no-float.spec.ts
│   │   ├── period-boundaries.spec.ts
│   │   ├── dst-close.spec.ts
│   │   └── restatement-supersede.spec.ts
│   ├── security/
│   │   ├── rls.two-tenants.spec.ts
│   │   ├── masking.comp.spec.ts
│   │   └── scim.jml.spec.ts
│   ├── a11y/
│   ├── visual/
│   ├── load/
│   ├── property/                                # fast-check / hypothesis
│   └── fixtures/
│       ├── workbooks/
│       ├── erps/
│       └── packs/
│
├── configs/
│   ├── error-codes.yaml                         # LX source
│   ├── metrics/                                 # certified metrics as code
│   ├── workflows/                               # machine definitions as code
│   ├── sod.yaml
│   ├── entitlements.yaml
│   └── calendars/
│
└── vendor/                                      # only if that is the source model
```

### Product Information Architecture (user-facing, mirrors apps/web)

```
OmniPlan
├── Home (personalized KPIs + inbox + stale-data badges)
├── Plan
│   ├── Budget (bottom-up, top-down, ZBB, driver)
│   ├── Forecast (rolling, statistical, ML scenario)
│   ├── Long-range / Strategic
│   ├── Headcount & Comp
│   ├── CapEx & Depreciation
│   ├── Revenue & RevRec
│   ├── OpEx & Vendors
│   └── Scenarios & Goal Seek / Solver / Tornado / Monte Carlo
├── Actuals
│   ├── Flash
│   ├── Variance
│   ├── Flux + Commentary
│   └── Drill-to-source + Lineage Inspector
├── Close (R2R)
│   ├── Calendar & SLAs
│   ├── Reconciliations
│   ├── Journals
│   ├── IC Matching
│   └── Certify / eSign
├── Consolidate
│   ├── Hierarchy & Ownership %
│   ├── Books (MGMT / IFRS / Local / Tax)
│   ├── Eliminations & NCI
│   └── FX & CTA
├── Cash & Treasury
├── Tax / Leases / SBC
├── ESG
├── Deals & Impairment
├── Analyze
│   ├── Metric Catalog
│   ├── Profitability (product/customer/channel/geo)
│   ├── Cohorts / Unit Economics
│   ├── Working Capital
│   └── Benchmarks
├── Report
│   ├── Dashboards
│   ├── Builder
│   ├── Board Pack
│   ├── Statutory / Investor
│   └── Exports (PDF/PPT/XLSX/Parquet)
├── Integrate
├── Automate (workflow, alerts, webhooks)
├── Model Ops (branches, releases, UAT promotion)
├── Academy
└── Admin (MDM, IAM, SoD, calendars, residency, audit)
```

---

## Known deviations from Part LXI (decided, not drift)

These are the differences between the Codex tree above and what OmniPlan will actually
build. Each is an explicit, recorded decision — not an accident. Anything **not** listed
here is still a target, and a divergence found in the repo is a defect.

| Codex tree element                                                                                                        | Decision                                                                                                                                                                                                               | Authority                       |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `apps/web/` as Next.js App Router                                                                                         | **Superseded.** The web client stays React 19 + Vite in `src/`. The five-pillar information architecture at the bottom of this file is honoured in full; only the framework differs.                                   | ADR-003                         |
| `pnpm-workspace.yaml`, `turbo.json`                                                                                       | Deferred. The monorepo split happens at stage S3, triggered by measured need, not on a date.                                                                                                                           | ADR-003                         |
| `docker-compose*.yml`, `.devcontainer/`                                                                                   | Deferred. No Docker in the current environment (K2 capability probe). The files land with the first environment that can run them.                                                                                     | ADR-003, Section 4.2            |
| Rust / Wasm crates                                                                                                        | Non-goal until CI can compile Rust. Money stays decimal.js in TypeScript.                                                                                                                                              | ADR-004                         |
| `infra/terraform/**`, `ops/**`                                                                                            | Phase 2. Written when there is a cloud account to apply them to; unapplied IaC is fiction.                                                                                                                             | Section 18.4                    |
| `.github/workflows/**`                                                                                                    | Cannot be pushed from this environment (GitHub App permission). Delivered as numbered patches in `ci-patches/` for a human to apply.                                                                                   | ADR-011                         |
| Kafka / Redis modules                                                                                                     | Not adopted in Phase 1. The outbox pattern runs in Postgres until measurement justifies a broker.                                                                                                                      | ADR-003, ADR-005                |
| `.agent/BLUEPRINT_GAPS.md`, `FINANCIAL_RULES.md`, `ERROR_CODES.md`, `METRIC_REGISTRY.md`, `SOD_MATRIX.md`, `CALENDARS.md` | Content exists inside `.agent/BLUEPRINT.md` (Sections 6, 16.8, and Appendix A). They are extracted into standalone generated files in Phase 0/1, at which point they become the generated artefacts the Codex intends. | Section 18.2 W0.4, Section 18.3 |
