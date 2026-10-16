# Secondary Voice Triangulation — Enterprise FP&A User Friction

> **Status:** SECONDARY EVIDENCE ONLY · **Date:** 2026-08-10  
> **Purpose:** Work around the absence of live participant access by extracting recurring public-review signals. This cannot validate FinPlan’s ICP, willingness-to-pay, deployment preference, or workflow demand.

## Method

Reviewed public review aggregations and comparison pages for Anaplan, OneStream, and Pigment. Sources may contain vendor/comparison-site incentives, AI summaries, old reviews, and non-representative samples; use only to generate questions and challenge hypotheses.

## Signals

| Signal                                                                     | Public evidence                                                                                                                                                                                                                                                                                                 | Implication for FinPlan hypothesis                                                                          | Confidence |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------- |
| Powerful planning often comes with learning/training burden                | Anaplan review summaries cite complexity, implementation/training needs, and large-model concerns. [Capterra](https://www.capterra.com/p/129412/Anaplan/reviews/) · [G2 guide](https://learn.g2.com/best-budgeting-and-forecasting-software)                                                                    | Analyst workspace must make formula/lineage/error/lifecycle understandable, not merely spreadsheet-like.    | Medium     |
| Enterprise unified finance value competes with implementation/admin burden | OneStream review sources praise unification/flexibility while noting professional implementation, complex rules, Excel add-in/usability and admin learning. [G2](https://www.g2.com/products/onestream-unified-epm/reviews) · [Software Advice](https://www.softwareadvice.com/product/263326-OneStream-XF/)    | Close/reconciliation value needs implementation accelerator, evidence controls, and role-specific UX.       | Medium     |
| Modern UX does not remove advanced-model complexity                        | Pigment review/comparison sources mention modern/collaborative UX but formula learning, customization, integration, and scale/complexity trade-offs. [G2](https://www.g2.com/compare/pigment-2024-01-19-vs-planful) · [Research.com](https://research.com/software/reviews/pigment)                             | Atlas must prioritize decision clarity and safe model interaction; visual polish alone is insufficient.     | Medium     |
| Large model / concurrent use performance is a buyer concern                | Public Anaplan/Pigment comparison content mentions scale/concurrency performance as a concern. [G2 guide](https://learn.g2.com/best-budgeting-and-forecasting-software) · [Drivetrain comparison](https://www.drivetrain.ai/post/pigment-vs-anaplan)                                                            | Reference workload, virtualized grid, queue/conflict state, and performance tests remain core—not deferred. | Low–Medium |
| Implementation time-to-value is part of product competition                | Public vendor/comparison content consistently contrasts implementation/support burden with speed-to-value. [OneStream reviews](https://www.getapp.com/finance-accounting-software/a/onestream-xf/reviews/) · [Anaplan review](https://www.golimelight.com/blog/anaplan-pricing-reviews-features-is-it-worth-it) | Pilot/implementation charter and controlled import/template path are strategic product requirements.        | Medium     |

## Disconfirming evidence

- Review sources disagree on ease of use/setup and have differing review populations; no single rating should drive product decisions.
- Public review complaints may reflect poor implementation/configuration rather than intrinsic product failure.
- Secondary evidence does not show that local-first/hybrid is desired, that a $500k+ package is viable, or that FinPlan’s proposed wedge wins.

## Changes to research plan

1. Add a direct prompt in R-02: “Which implementation/training/admin burden did you experience, and what would have reduced it?”
2. Add scenario test to Model Workspace: formula/dependency/validation explanation under time pressure.
3. Add pilot acceptance measure: time to first reconciled actuals and time to first reproducible board-pack snapshot.
4. Preserve existing primary research requirements; do not mark A-01/A-02/A-03/A-13/A-14 validated.
