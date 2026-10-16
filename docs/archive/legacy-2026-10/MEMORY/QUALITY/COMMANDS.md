---
id: MEMORY/QUALITY/COMMANDS.md
status: active
last_verified: 2026-08-18
verified_by: arena-agent/session-017
confidence: high
---

# QUALITY/COMMANDS — exact commands

All SOURCE references are `package.json#scripts` unless stated.

```
install:      npm install                                   SOURCE: n/a   RAN: yes  EXIT: 0
dev:          npm run dev            (vite)                 SOURCE: scripts.dev        RAN: no
build:        npm run build          (tsc --noEmit && eslint && vite build)
                                                            SOURCE: scripts.build      RAN: no
typecheck:    npx tsc --noEmit                              SOURCE: scripts.build      RAN: yes  EXIT: 0
lint:         npx eslint src --max-warnings 0               SOURCE: scripts.build      RAN: no
test (all):   npm test               (vitest, 8GiB heap)    SOURCE: scripts.test       RAN: no  (~15 min)
test (one):   npx vitest run <path> --reporter=dot          SOURCE: handover           RAN: yes
sharded:      npm run test:sharded                          SOURCE: scripts            RAN: no
e2e:          npm run test:e2e       (playwright)           SOURCE: scripts            RAN: no
money ratchet:      node scripts/money-ast-detector.mjs     SOURCE: scripts.money:ast  RAN: yes  EXIT: 0
money worklist:     node scripts/money-ast-detector.mjs --list
money one file:     node scripts/money-ast-detector.mjs --file <path>      RAN: yes
money rebaseline:   node scripts/money-ast-detector.mjs --update  (then prettier --write)
fabrication:        node scripts/fabrication-detector.mjs   SOURCE: scripts.fabrication:audit  RAN: yes  EXIT: 0
fabrication list:   node scripts/fabrication-detector.mjs --list
docs gates:         npm run docs:verify                     SOURCE: scripts            RAN: no
engine manifest:    npm run engines:verify                  SOURCE: scripts            RAN: no
memory integrity:   node MEMORY/_system/check.mjs           SOURCE: this brain         RAN: yes
```

**Notes that cost time when ignored**

- vitest 4.1.7 has **no `basic` reporter**. Use the default or `--reporter=dot`.
  A run reporting `0 tests` means a parse error.
- Detectors `require('typescript')` — after a sandbox restore run `npm install` first, or you get
  `Cannot find module 'typescript'`.
- Push must run as a background process; pre-push (~3–5 min) exceeds short command timeouts.
