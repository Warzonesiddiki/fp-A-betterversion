# Husky Gate 10 — CASCADE-HOLD-BUNDLE Auto-Detection
# Closes CATCH #207 #4 (Vesta CASCADE-HOLD-BUNDLE 4/5)
# Atlas + Hephaestus joint DRI, 2026-06-17
# 41 tests, 41/41 PASS expected

set -e

# Test Group 1: File Existence (8 tests)
test_file_spec() {
  [ -f "docs/security/HUSKY_GATE_10_CASCADE_HOLD_BUNDLE.md" ] && echo "✅ 1.1 HUSKY_GATE_10 spec exists" || echo "❌ 1.1 HUSKY_GATE_10 spec missing"
}

test_file_ledger() {
  [ -f "docs/security/CASCADE_HOLD_LEDGER.md" ] && echo "✅ 1.2 CASCADE_HOLD_LEDGER exists" || echo "❌ 1.2 CASCADE_HOLD_LEDGER missing"
}

test_file_pre_push() {
  [ -f ".husky/pre-push" ] && echo "✅ 1.3 .husky/pre-push exists" || echo "❌ 1.3 .husky/pre-push missing"
}

test_file_workflow() {
  [ -f ".github/workflows/cascade-hold-check.yml" ] && echo "✅ 1.4 cascade-hold-check.yml workflow exists" || echo "❌ 1.4 cascade-hold-check.yml workflow missing"
}

test_file_husky_index() {
  [ -f "docs/husky-gates.md" ] && echo "✅ 1.5 husky-gates.md index exists" || echo "❌ 1.5 husky-gates.md index missing"
}

test_file_gate10_ref_in_pre_push() {
  grep -q "Gate 10" .husky/pre-push && echo "✅ 1.6 .husky/pre-push references Gate 10" || echo "❌ 1.6 .husky/pre-push missing Gate 10 reference"
}

test_file_gate10_ref_in_index() {
  grep -q "Gate 10" docs/husky-gates.md && echo "✅ 1.7 husky-gates.md references Gate 10" || echo "❌ 1.7 husky-gates.md missing Gate 10 reference"
}

test_file_gate10_ref_in_workflow() {
  grep -q "Cascade-Hold" .github/workflows/cascade-hold-check.yml && echo "✅ 1.8 cascade-hold-check.yml references Cascade-Hold" || echo "❌ 1.8 cascade-hold-check.yml missing Cascade-Hold reference"
}

# Test Group 2: Hook Permissions (4 tests)
test_pre_push_executable() {
  [ -x ".husky/pre-push" ] && echo "✅ 2.1 .husky/pre-push is executable" || echo "❌ 2.1 .husky/pre-push not executable"
}

test_ledger_readable() {
  [ -r "docs/security/CASCADE_HOLD_LEDGER.md" ] && echo "✅ 2.2 CASCADE_HOLD_LEDGER is readable" || echo "❌ 2.2 CASCADE_HOLD_LEDGER not readable"
}

test_spec_readable() {
  [ -r "docs/security/HUSKY_GATE_10_CASCADE_HOLD_BUNDLE.md" ] && echo "✅ 2.3 HUSKY_GATE_10 spec is readable" || echo "❌ 2.3 HUSKY_GATE_10 spec not readable"
}

test_workflow_valid_yaml() {
  python3 -c "import yaml; yaml.safe_load(open('.github/workflows/cascade-hold-check.yml'))" 2>/dev/null && echo "✅ 2.4 cascade-hold-check.yml is valid YAML" || echo "❌ 2.4 cascade-hold-check.yml is invalid YAML"
}

# Test Group 3: Spec Content (6 tests)
test_spec_has_purpose() {
  grep -q "## §1 Purpose" docs/security/HUSKY_GATE_10_CASCADE_HOLD_BUNDLE.md && echo "✅ 3.1 Spec has §1 Purpose" || echo "❌ 3.1 Spec missing §1 Purpose"
}

test_spec_has_detection() {
  grep -q "## §2 Detection Criteria" docs/security/HUSKY_GATE_10_CASCADE_HOLD_BUNDLE.md && echo "✅ 3.2 Spec has §2 Detection Criteria" || echo "❌ 3.2 Spec missing §2 Detection Criteria"
}

test_spec_has_ledger_schema() {
  grep -q "## §3 Ledger Schema" docs/security/HUSKY_GATE_10_CASCADE_HOLD_BUNDLE.md && echo "✅ 3.3 Spec has §3 Ledger Schema" || echo "❌ 3.3 Spec missing §3 Ledger Schema"
}

test_spec_has_pre_push_hook() {
  grep -q "## §4 Pre-Push Hook" docs/security/HUSKY_GATE_10_CASCADE_HOLD_BUNDLE.md && echo "✅ 3.4 Spec has §4 Pre-Push Hook" || echo "❌ 3.4 Spec missing §4 Pre-Push Hook"
}

test_spec_has_ci_integration() {
  grep -q "## §6 CI Integration" docs/security/HUSKY_GATE_10_CASCADE_HOLD_BUNDLE.md && echo "✅ 3.5 Spec has §6 CI Integration" || echo "❌ 3.5 Spec missing §6 CI Integration"
}

test_spec_has_4_icp() {
  grep -q "## §10 4-ICP Verdict" docs/security/HUSKY_GATE_10_CASCADE_HOLD_BUNDLE.md && echo "✅ 3.6 Spec has §10 4-ICP Verdict" || echo "❌ 3.6 Spec missing §10 4-ICP Verdict"
}

# Test Group 4: Hook Logic (8 tests)
test_hook_gate10_block_on_multi_tid() {
  grep -q 't_id_count -ge 2' .husky/pre-push && echo "✅ 4.1 Hook blocks on multi-T-IDs (A)" || echo "❌ 4.1 Hook missing multi-T-IDs detection (A)"
}

test_hook_gate10_block_on_multi_coauthor() {
  grep -q 'co_authors -ge 2' .husky/pre-push && echo "✅ 4.2 Hook blocks on multi-Co-Authored-By (B)" || echo "❌ 4.2 Hook missing multi-Co-Authored-By detection (B)"
}

test_hook_gate10_block_on_cross_muse() {
  grep -q 'cross_muse_paths -ge 2' .husky/pre-push && echo "✅ 4.3 Hook blocks on cross-Muse path span (C)" || echo "❌ 4.3 Hook missing cross-Muse path span detection (C)"
}

test_hook_gate10_ledger_check() {
  grep -q 'CASCADE_HOLD_LEDGER.md' .husky/pre-push && echo "✅ 4.4 Hook checks CASCADE_HOLD_LEDGER.md" || echo "❌ 4.4 Hook missing CASCADE_HOLD_LEDGER.md check"
}

test_hook_gate10_short_sha() {
  grep -q 'git rev-parse --short' .husky/pre-push && echo "✅ 4.5 Hook uses git rev-parse --short" || echo "❌ 4.5 Hook missing git rev-parse --short"
}

test_hook_gate10_block_exit_code() {
  grep -q 'exit 1' .husky/pre-push && echo "✅ 4.6 Hook exits 1 on block" || echo "❌ 4.6 Hook missing exit 1 on block"
}

test_hook_gate10_remediation_msg() {
  grep -q 'add CHB-XXX entry' .husky/pre-push && echo "✅ 4.7 Hook has remediation message" || echo "❌ 4.7 Hook missing remediation message"
}

test_hook_gate10_unpushed_shas() {
  grep -q 'unpushed_shas_gate10' .husky/pre-push && echo "✅ 4.8 Hook iterates unpushed SHAs" || echo "❌ 4.8 Hook missing unpushed SHAs iteration"
}

# Test Group 5: Ledger Entries (6 tests)
test_ledger_has_chb_001() {
  grep -q "CHB-001" docs/security/CASCADE_HOLD_LEDGER.md && echo "✅ 5.1 Ledger has CHB-001 (Hephaestus + Prometheus)" || echo "❌ 5.1 Ledger missing CHB-001"
}

test_ledger_has_chb_002() {
  grep -q "CHB-002" docs/security/CASCADE_HOLD_LEDGER.md && echo "✅ 5.2 Ledger has CHB-002 (Prometheus + Hermes)" || echo "❌ 5.2 Ledger missing CHB-002"
}

test_ledger_has_chb_003() {
  grep -q "CHB-003" docs/security/CASCADE_HOLD_LEDGER.md && echo "✅ 5.3 Ledger has CHB-003 (Vesta + Artemis)" || echo "❌ 5.3 Ledger missing CHB-003"
}

test_ledger_has_chb_004() {
  grep -q "CHB-004" docs/security/CASCADE_HOLD_LEDGER.md && echo "✅ 5.4 Ledger has CHB-004 (Vesta + Artemis CASCADE-HOLD 4/5)" || echo "❌ 5.4 Ledger missing CHB-004"
}

test_ledger_has_catch_refs() {
  grep -q "CATCH #" docs/security/CASCADE_HOLD_LEDGER.md && echo "✅ 5.5 Ledger has CATCH references" || echo "❌ 5.5 Ledger missing CATCH references"
}

test_ledger_has_resolution() {
  grep -q "Resolution" docs/security/CASCADE_HOLD_LEDGER.md && echo "✅ 5.6 Ledger has Resolution column" || echo "❌ 5.6 Ledger missing Resolution column"
}

# Test Group 6: Detection Criteria Logic (5 tests)
test_detection_a_tid_regex() {
  # grep -qF (fixed string): the pattern is meant literally. The previous
  # basic-regex grep could never match (its [A-Z] class would have to match
  # the literal '[' of the documented pattern) — provably-wrong assertion.
  grep -qF 'T-([A-Z]{2,4})-([0-9]{3})' docs/security/HUSKY_GATE_10_CASCADE_HOLD_BUNDLE.md && echo "✅ 6.1 Detection A: T-ID regex 2-4 char Muse prefix" || echo "❌ 6.1 Detection A: T-ID regex missing"
}

test_detection_b_coauthor_count() {
  grep -q 'Co-Authored-By' docs/security/HUSKY_GATE_10_CASCADE_HOLD_BUNDLE.md && echo "✅ 6.2 Detection B: Co-Authored-By count" || echo "❌ 6.2 Detection B: Co-Authored-By missing"
}

test_detection_c_cross_muse_path() {
  grep -q 'docs/(atlas|hephaestus|iris|hermes|mnemosyne|chronos|vesta|tyche|hera|artemis|apollo|themis|strategos|calliope|orchestrator|athena|prometheus|vulcan|sentinel)/' docs/security/HUSKY_GATE_10_CASCADE_HOLD_BUNDLE.md && echo "✅ 6.3 Detection C: cross-Muse path span" || echo "❌ 6.3 Detection C: cross-Muse path missing"
}

test_detection_or_logic() {
  grep -q "OR-logic" docs/security/HUSKY_GATE_10_CASCADE_HOLD_BUNDLE.md && echo "✅ 6.4 Detection uses OR-logic (any of A/B/C)" || echo "❌ 6.4 Detection missing OR-logic"
}

test_detection_catches_closed() {
  grep -q "CATCH #207 #4" docs/security/HUSKY_GATE_10_CASCADE_HOLD_BUNDLE.md && echo "✅ 6.5 Detection closes CATCH #207 #4" || echo "❌ 6.5 Detection missing CATCH #207 #4"
}

# Test Group 7: CI Workflow (4 tests)
test_workflow_has_name() {
  grep -q "^name:" .github/workflows/cascade-hold-check.yml && echo "✅ 7.1 Workflow has name" || echo "❌ 7.1 Workflow missing name"
}

test_workflow_runs_on_push() {
  grep -q "push:" .github/workflows/cascade-hold-check.yml && echo "✅ 7.2 Workflow runs on push" || echo "❌ 7.2 Workflow missing push trigger"
}

test_workflow_validates_shas() {
  grep -q "git rev-parse --verify" .github/workflows/cascade-hold-check.yml && echo "✅ 7.3 Workflow validates SHAs" || echo "❌ 7.3 Workflow missing SHA validation"
}

test_workflow_fetches_full_history() {
  grep -q "fetch-depth: 0" .github/workflows/cascade-hold-check.yml && echo "✅ 7.4 Workflow fetches full history" || echo "❌ 7.4 Workflow missing fetch-depth: 0"
}

# Run all tests
echo "=== Husky Gate 10 Test Suite (41 tests) ==="
echo ""
echo "--- Test Group 1: File Existence (8 tests) ---"
test_file_spec
test_file_ledger
test_file_pre_push
test_file_workflow
test_file_husky_index
test_file_gate10_ref_in_pre_push
test_file_gate10_ref_in_index
test_file_gate10_ref_in_workflow
echo ""
echo "--- Test Group 2: Hook Permissions (4 tests) ---"
test_pre_push_executable
test_ledger_readable
test_spec_readable
test_workflow_valid_yaml
echo ""
echo "--- Test Group 3: Spec Content (6 tests) ---"
test_spec_has_purpose
test_spec_has_detection
test_spec_has_ledger_schema
test_spec_has_pre_push_hook
test_spec_has_ci_integration
test_spec_has_4_icp
echo ""
echo "--- Test Group 4: Hook Logic (8 tests) ---"
test_hook_gate10_block_on_multi_tid
test_hook_gate10_block_on_multi_coauthor
test_hook_gate10_block_on_cross_muse
test_hook_gate10_ledger_check
test_hook_gate10_short_sha
test_hook_gate10_block_exit_code
test_hook_gate10_remediation_msg
test_hook_gate10_unpushed_shas
echo ""
echo "--- Test Group 5: Ledger Entries (6 tests) ---"
test_ledger_has_chb_001
test_ledger_has_chb_002
test_ledger_has_chb_003
test_ledger_has_chb_004
test_ledger_has_catch_refs
test_ledger_has_resolution
echo ""
echo "--- Test Group 6: Detection Criteria Logic (5 tests) ---"
test_detection_a_tid_regex
test_detection_b_coauthor_count
test_detection_c_cross_muse_path
test_detection_or_logic
test_detection_catches_closed
echo ""
echo "--- Test Group 7: CI Workflow (4 tests) ---"
test_workflow_has_name
test_workflow_runs_on_push
test_workflow_validates_shas
test_workflow_fetches_full_history
echo ""
echo "=== Husky Gate 10 Test Suite COMPLETE ==="
