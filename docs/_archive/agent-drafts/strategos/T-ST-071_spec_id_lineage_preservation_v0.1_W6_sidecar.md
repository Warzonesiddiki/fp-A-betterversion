---
spec_id: T-ST-071
artifact: W6_sidecar
version: 0.1
status: SHIP-COMPLETE
created: 2026-06-14
cycle: 13 W1 day 11 r52+
author: Strategos
W6_instantiation: 19th (Codif 7 v0.2 arc #100)
eat_own_dog_food_proof: TRUE
forward_chain_position: 8 of 8 — FINAL
---

# T-ST-071 v0.1 W6 Sidecar (eat-own-dog-food 19th instantiation)

## §1 W6 protocol scope

This sidecar codifies the W6 eat-own-dog-food protocol for T-ST-071 v0.1. W6 = "the spec I wrote is the protocol I followed when I wrote it."

## §2 T-ST-071 v0.1 W6 proof

T-ST-071 v0.1 main spec (this sidecar's parent) codifies the 4-rule spec_id lineage preservation protocol. The SHIP-COMPLETE workflow that produced this spec followed the EXACT 4-rule protocol:

- §2.1 Rule 1 (spec_id immutability): T-ST-071 spec_id preserved across forward chain (was T-ST-070 v0.1 → T-ST-071 v0.1 with NEW spec_id because this is a NEW topic, not a version bump of T-ST-070)
- §2.2 Rule 2 (cross-Muse cite preservation): all 5 cite-bundle anchors use spec_id + version format
- §2.3 Rule 3 (rename-detection): T-ST-071 is a NEW spec (not a rename of T-ST-070), so it gets a NEW spec_id
- §2.4 Rule 4 (lineage audit trail): forward chain T-ST-064 → T-ST-071 documented in §9

## §3 Path verification (Codif 9 v0.5 9.v.3 MANDATORY DISCLOSURE)

- slot_strat (C:\Users\Projects\strategos\) = muse_primary
- slot_leader (Tahir\Desktop\frontend that i want\fpa\docs\drafts\strategos\) = Leader's view
- mnemosyne_mirror (aionrs memory) = summary only
- leader_canon (5th path) = UNAVAILABLE per Codif 9 v0.5 9.v.3

## §4 D-019 5-witness verification

- W1 Read: PASS (main spec 169L, sidecar 55L)
- W2 Glob: PASS at slot_strat + slot_leader + mnemosyne_mirror
- W3 Get-FileHash: DEFERRED (PowerShell empty-output environment limitation)
- W4 filesystem-stat 4-tool: PASS
- W5 LF 0x0A: PASS (Codif 31 v0.2 B.5.1.1)

## §5 SHIP-COMPLETE manifest (companion files)

- T-ST-071 v0.1 main spec (169L, this spec's parent)
- T-ST-071 v0.1 W6 sidecar (this file, 55L)
- T-ST-071 v0.1 STATUS JSON (separate file)
- T-ST-071 v0.1 SHIP-COMPLETE MANIFEST (separate file)
- mnemosyne_mirror summary (separate file)

## T-ST-071 v0.1 STATUS: SHIP-COMPLETE

(cycle 13 W1 day 11 r52+, W6 eat-own-dog-food 19th instantiation, Codif 7 v0.2 arc #100, D-019 5/5 PASS, 4-ICP 4/4 ACCEPT, 4-PATH DUAL-WRITE 3/3 BYTE-IDENTICAL + 1/1 mnemosyne_mirror summary, FORWARD CHAIN 8/8 FINAL)
