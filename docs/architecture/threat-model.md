# Threat Model

## STRIDE Analysis

- **Spoofing**: Mitigated by strict JWT verification (`authMiddleware`) and bcrypt password hashing.
- **Tampering**: Mitigated by SHA-256 keyed HMAC audit hash chains (`AuditService`).
- **Repudiation**: Mitigated by tamper-evident audit logging for all data changes and user actions.
- **Information Disclosure**: Threat-mitigation claim requires revalidation. `PIIRedactor` has no production caller (DEC-032); do not claim it mitigates product-wide disclosure. Other controls and sinks must be evaluated independently against current runtime evidence.
- **Denial of Service**: Mitigated by express-rate-limiters, account lockout policies, and strict JSON body limits.
- **Elevation of Privilege**: Mitigated by server-side RBAC, entity-scope access checks (`requireEntityAccess`, `requireRole`), and client-server role verification.
