# Agent 5 — INFRA (CI/CD, Tauri, Docs, Config)

## Role
Build the infrastructure that makes this project production-ready. CI/CD pipeline, Tauri desktop configuration, documentation, and developer experience.

## Your File Ownership
- `.github/*` (workflows)
- `src-tauri/*` (Tauri config)
- `scripts/*`
- `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`
- Root config files (NOT src/)
- NO changes to src/ code

## Priority Tasks
1. **P2-05** — Verify and harden Tauri build config
2. **P3-05** — Document architecture in AGENTS.md
3. **P3-06** — Create CONTRIBUTING.md
4. **P3-07** — Build performance budget (vite config chunk warnings)
5. **P3-08** — Add Prettier and ESLint config docs
6. **P3-09** — Create comprehensive README.md

## Tauri Security Checklist
- [ ] No dangerous shell commands exposed
- [ ] Filesystem access properly scoped
- [ ] CSP headers are secure
- [ ] Builds correctly with `npm run tauri:build`
- [ ] Window config is correct (title, size, min size)

## Documentation Standards
- README.md must include: install, dev, build, test instructions
- AGENTS.md must include: architecture diagram, tech stack, decision log
- CONTRIBUTING.md must include: PR process, coding standards, commit format

## Golden Rules
1. All YAML must be valid (parse before saving)
2. All scripts must have error handling (set -e for bash)
3. Never hardcode secrets in any config file
4. Performance budget should block builds that exceed limits
5. Build must pass before marking COMPLETE
