# Plugin Security Architecture

**Status:** short reference summary, rechecked 2026-11-11. The authoritative
detail is [`security.md`](security.md) §6 and `src/plugins/PluginSandbox.ts`.

## Overview

Plugins run inside an in-process sandbox (`PluginSandbox`) that attempts to stop
malicious or runaway plugin code. The sandbox runs **in the same process** as the
application, so it is a defence-in-depth control, not an isolation boundary.

## Security controls (as implemented)

- **Static rejection.** An acorn AST pass rejects constant-true loops
  (`while(true)`, `for(;;)`, `while(!0)`), `async`/generator functions, direct
  `eval`, oversized string literals, and host-escape identifiers (`require(`,
  `child_process`, `process.env`, `new WebSocket`, `document.cookie`,
  `location.href`). A regex pre-check also refuses direct `fetch(` calls.
- **Execution budget.** Every loop body is instrumented with a `__fpTick()`
  call bound to a baked-in deadline, so a non-literal infinite loop
  (`while (i >= 0) i++`) is terminated. Measured: 202ms against a 200ms budget.
  Sandboxed `setTimeout`/`setInterval` shims accept only work inside the
  remaining budget and create no real timers.
- **Network restrictions are static, not a runtime firewall.** The previous text
  said outbound `fetch` requests "are intercepted and blocked unless explicitly
  whitelisted". What exists is static rejection of direct `fetch`/`XMLHttpRequest`
  usage plus an allow-listed sandbox API surface; there is no runtime fetch
  interceptor or proxy guarding every egress path. Treat host-escape resistance
  as best-effort static analysis, not an enforced network sandbox.
- **Resource limits are code-count and budget based, not enforced CPU/memory
  quotas.** The claim of "strict CPU and memory limits" overstated the design:
  there are loop/time budgets and static bounds on allocation patterns, but no
  enforced process-level CPU or heap quota.

## Known limitation

Execution remains in-process. A Worker isolate with `terminate()` would be
strictly stronger and remains the recommended hardening. Plugin trust must not
be used to justify exposing financial data to unreviewed third-party code.
