ATHENA - Stale Reference Audit (FAST, 2026-06-15)
Method: combined regex \b(archived1|archived2|...)\b per file (O(N) per file)
Targeted: high-value locations only (.openhands, docs, .claude-flow, root)

=== SUMMARY ===
Archived filenames: 202
MD files scanned: 1477
Files with stale references: 37

=== STALE REFERENCES (actionable) ===

FILE: .openhands\A1_REPORT.md
-> refs: INDEX

FILE: .openhands\athena-FINAL-SUMMARY.md
-> refs: INDEX, PART_061_SALES_ENABLEMENT, PART_146_BANK_FEEDS_RECONCILIATION

FILE: .openhands\stale-reference-audit.md
-> refs: INDEX, PART_021_INFRA_OPERATIONS_RUNBOOK, Part_03_Technical_Architecture, PART_031_CROSS_CUTTING, PART_161_TREASURY_DEBT_COVENANTS

FILE: .openhands\audit\AGENT-7-spec-inventory.md
-> refs: INDEX, PART_003_PUSH_BLOCKER_REPORT, PART_005_QUALITY_STANDARDS_TESTING, PART_007_INTEGRATION_API_STRATEGY, PART_01_CURRENT_STATE_AUDIT, PART_010_SECTOR_MODELS_OVERVIEW, PART_012_CROSS_CUTTING_CONCERNS, PART_019_CROSS_CUTTING_CONCERNS, PART_022_OBSERVABILITY_SLO, PART_023_DISASTER_RECOVERY, PART_024_DEPLOYMENT_TOPOLOGY, PART_026_UX_POLICY_LIBRARY, PART_064_CROSS_CUTTING, PART_064_THIRD_PARTY_ECOSYSTEM, PART_070_CROSS_CUTTING, PART_070_QUERY_OPTIMIZATION, PART_071_CACHING_STRATEGY, PART_071_CROSS_CUTTING, PART_072_CROSS_CUTTING, PART_072_LAZY_LOADING, PART_073_CROSS_CUTTING, PART_073_MEMORY_MANAGEMENT, PART_078_CROSS_CUTTING, PART_079_CROSS_CUTTING, PART_080_PARTNER_INTEGRATION_PROGRAM, PART_083_TYPE_SYSTEM, PART_101_BUDGETING, PART_106_TAX, PART_122_INDUSTRY_BENCHMARKS, PART_123_CUSTOMER_SUCCESS_METRICS, PART_156_DESIGN_TOKENS_INDEX, PART_157_DAY_IN_LIFE_WORKFLOWS, PART_158_USER_RESEARCH_SYNTHESIS, PART_159_MARKETING_AUTOMATION, PART_195_PRODUCT_MARKETING, PART_196_CUSTOMER_PERSONAS_DETAIL, PART_197_CASES_AND_TESTIMONIALS

FILE: docs\COMPLETE_PROJECT_SPEC.md
-> refs: INDEX

FILE: docs\CYCLE_13_GAP_MATRIX.md
-> refs: INDEX

FILE: docs\HANDOVER_TO_NEXT_AI.md
-> refs: INDEX, Part_151_Excel_Compatibility, Part_155_Continuous_Auditing, Part_156_Empty_State_Catalog, Part_158_Auth_And_Sessions, Part_159_Multi_Standard_CoA, Part_160_Keyboard_Shortcut_Catalog, Part_163_Per_Sector_Quick_Start, Part_164_Driver_Generator, Part_165_Roll_Out_Strategy, Part_166_Nav_Map, Part_167_AI_Safety, Part_170_SLA_Monitoring, Part_172_Per_Persona_Tutorial, Part_173_Compliance_Matrix, Part_174_Driver_Library_Catalog, Part_180_Test_Strategy, Part_181_Test_Coverage_Matrix, Part_182_Rate_Limiting, Part_185_Reconciliation_Drift, Part_186_Multi_Calendar, Part_189_Test_Specifications, Part_190_Acme_Corp_Sample, Part_192_Performance_Benchmarks_Detailed, Part_195_Deprecation, Part_197_DR, Part_198_Competitive_Intel, Part_199_Roadmap

FILE: docs\IMP_ANSWERS_Q1801_2200.md
-> refs: INDEX

FILE: docs\MERGED_MASTER_PLAN.md
-> refs: INDEX

FILE: docs\audits\sentinel\SA-004-tmn-031-4path-evidence-ledger.md
-> refs: INDEX

FILE: docs\audits\sentinel\SA-005-tmn-032-codif-22-v02-lineage-spec-identity-collision.md
-> refs: INDEX

FILE: docs\drafts\atlas\CATCH_2026-06-15_v014_filename_mismatch.md
-> refs: PART_021_INFRA_OPERATIONS_RUNBOOK, PART_022_INFRA_OBSERVABILITY_SLO, PART_023_INFRA_DISASTER_RECOVERY, PART_024_INFRA_DEPLOYMENT_TOPOLOGY, PART_084_BUILD_PIPELINE_DETAIL, PART_085_RELEASE_MANAGEMENT, PART_086_ENVIRONMENT_STRATEGY

FILE: docs\drafts\atlas\T-ATL-010_FORMALIZATION.md
-> refs: INDEX

FILE: docs\drafts\atlas\T-ATL-027_S5_CARRY_FORWARD.md
-> refs: INDEX

FILE: docs\drafts\atlas\T-ATL-027_v0.3_SEVMatrix.md
-> refs: INDEX

FILE: docs\drafts\hera\T-HE-049_pattern_f_6_spec_corpus_final_synthesis_cycle_13_w1_v0.1.md
-> refs: INDEX

FILE: docs\drafts\leader\ATLAS-TREASURY-VERIFICATION_v0.1.md
-> refs: PART_161_TREASURY_DEBT_COVENANTS, PART_162_HEDGING_INSTRUMENTS, PART_163_INVESTMENT_CAP_TABLE, PART_164_M2M_MARK_TO_MARKET, PART_165_BANK_ACCOUNT_MANAGEMENT

FILE: docs\drafts\leader\ATLAS-V014-DELIVERABLE-SUMMARY_v0.1.md
-> refs: PART_021_INFRA_OPERATIONS_RUNBOOK, PART_022_INFRA_OBSERVABILITY_SLO, PART_023_INFRA_DISASTER_RECOVERY, PART_024_INFRA_DEPLOYMENT_TOPOLOGY, PART_084_BUILD_PIPELINE_DETAIL, PART_085_RELEASE_MANAGEMENT, PART_086_ENVIRONMENT_STRATEGY, PART_161_TREASURY_DEBT_COVENANTS, PART_162_HEDGING_INSTRUMENTS, PART_163_INVESTMENT_CAP_TABLE, PART_164_M2M_MARK_TO_MARKET, PART_165_BANK_ACCOUNT_MANAGEMENT

FILE: docs\drafts\leader\ATLAS-V014-ROUND2-DELIVERABLE-SUMMARY_v0.1.md
-> refs: PART_031_CROSS_CUTTING, PART_087_CD_PIPELINE, PART_088_DEPLOYMENT_AUTOMATION, PART_089_INFRA_COST_OPTIMIZATION

FILE: docs\drafts\leader\T-HE-049_pattern_f_6_spec_corpus_final_synthesis_cycle_13_w1_v0.1.md
-> refs: INDEX

FILE: docs\drafts\leader\T-LE-VERDICT-cycle_13_w2_day_1_turn_42plus_FUNDER-DIRECTIVE-COMPLETE-200-FILES_v0.14.md
-> refs: INDEX, PART_003_PUSH_BLOCKER_REPORT

FILE: docs\drafts\leader\T-LE-VERDICT-cycle_13_w2_day_1_turn_43plus_PUSH-BLOCKER-FIXED_v0.15.md
-> refs: INDEX, PART_083_TYPE_SYSTEM

FILE: docs\drafts\leader\T-MN-031_4_path_dual_write_evidence_ledger_v0.1.md
-> refs: INDEX

FILE: docs\drafts\leader\T-ST-047_v0_3_schema_freeze_7_item_agenda_execution_plan_v0.1.md
-> refs: INDEX

FILE: docs\drafts\leader\T-ST-047_v0_3_schema_freeze_7_item_agenda_execution_plan_v0.1_STATUS_2026-06-14_SHIP_COMPLETE.md
-> refs: INDEX

FILE: docs\drafts\leader\T-ST-048_19_spec_ratification_packet_strategic_synthesis_v4_v0.1.md
-> refs: INDEX

FILE: docs\drafts\leader\TEAM-BOOTSTRAP-STATUS-cycle-13-w2-day-1-turn-37plus_2026-06-15.md
-> refs: INDEX, PART_003_PUSH_BLOCKER_REPORT

FILE: docs\drafts\mnemosyne\T-HE-049_pattern_f_6_spec_corpus_final_synthesis_cycle_13_w1_v0.1.md
-> refs: INDEX

FILE: docs\drafts\mnemosyne_mirror\T-HE-049_pattern_f_6_spec_corpus_final_synthesis_cycle_13_w1_v0.1.md
-> refs: INDEX

FILE: docs\drafts\prometheus\T-PR-002b-INDEX.md
-> refs: INDEX

FILE: docs\drafts\strategos\T-HE-049_pattern_f_6_spec_corpus_final_synthesis_cycle_13_w1_v0.1.md
-> refs: INDEX

FILE: docs\drafts\strategos\T-ST-047_v0_3_schema_freeze_7_item_agenda_execution_plan_v0.1.md
-> refs: INDEX

FILE: docs\drafts\strategos\T-ST-047_v0_3_schema_freeze_7_item_agenda_execution_plan_v0.1_STATUS_2026-06-14_SHIP_COMPLETE.md
-> refs: INDEX

FILE: docs\drafts\strategos\T-ST-048_19_spec_ratification_packet_strategic_synthesis_v4_v0.1.md
-> refs: INDEX

FILE: FINPLAN_PRO_COMPLETE_ARCHITECTURE.md
-> refs: INDEX

FILE: OPENHANDS_MASTER_PROMPT.md
-> refs: INDEX

FILE: OPENHANDS_SHORT_PROMPT.md
-> refs: INDEX
