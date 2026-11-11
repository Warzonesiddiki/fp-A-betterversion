# Threat Model

**Status:** partial STRIDE sketch, rechecked 2026-11-11. It is not a complete
threat model, and it is not an independent security assessment. The authoritative
control-by-control detail is [`security.md`](security.md).

## STRIDE analysis (with current evidence boundaries)

- **Spoofing.** Partially mitigated. The optional server verifies JWTs in
  `authMiddleware` and hashes passwords with bcrypt. The honest limitation is on
  the client: `VITE_USE_MOCK_AUTH` provides forgeable unsigned mock tokens that
  are hard-blocked in production builds, and **MFA enrolment/verification is NOT
  IMPLEMENTED** in the client (`security.md` §2).
- **Tampering.** Partially mitigated. The client audit chain is SHA-256
  hash-chained and detects mutation, deletion, reordering and truncation, but it
  is **unkeyed**: an attacker with write access can recompute a consistent chain.
  A keyed **HMAC-SHA256** chain exists only in the optional server
  (`server/src/routes/audit.ts`), and the frontend has no `/api/audit` caller.
  The earlier claim of "SHA-256 keyed HMAC audit hash chains (`AuditService`)"
  described the server path as if it protected the client.
- **Repudiation.** Partially mitigated for the measured scope only. Client audit
  entries record actor, operation, entity, before/after values, reason and
  correlation id, and are hash-chained. Because the chain is unkeyed and
  client-local, it is not durable tamper evidence against a local adversary;
  that requires an append-only server sink (NOT IMPLEMENTED).
- **Information disclosure.** Partially mitigated, with explicit gaps. Live
  storage is AES-256-GCM at rest, but the device key sits in `localStorage`
  beside the data, so a copy of the browser profile is not protected; OS keychain
  integration is NOT IMPLEMENTED. Backup exports are **unencrypted JSON**
  (`docs/architecture/backup-restore.md` §8). `PIIRedactor` has no production
  caller (DEC-032), so it must not be claimed as product-wide disclosure
  mitigation. Sentry and PWA egress exist and are not covered by a complete
  data-flow inventory.
- **Denial of service.** Partially mitigated server-side by express rate limiters,
  account lockout policies and strict JSON body limits. Client-side, plugin
  runaway code is bounded by loop deadlines and static checks, not by enforced
  process quotas (`plugin-security.md`).
- **Elevation of privilege.** Partially mitigated. Client RBAC is client-only and
  bypassable (F-0016, open); server middleware adds real checks on the optional
  API. The claim of "client-server role verification" was not supported: the
  client does not depend on the server for authorization today.

## Not covered by this sketch

Live provider or customer environments, deployed infrastructure, multi-tenant
deployment, native OS permission boundaries, supply-chain and release signing.
These remain **UNVERIFIED** and require their own review before any
production-support claim.
