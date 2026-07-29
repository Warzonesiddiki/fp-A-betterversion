# Threat Model

## STRIDE Analysis

- **Spoofing**: Mitigated by strict JWT verification (`authMiddleware`) and bcrypt password hashing.
- **Tampering**: Mitigated by SHA-256 keyed HMAC audit hash chains (`AuditService`).
- **Repudiation**: Mitigated by tamper-evident audit logging for all data changes and user actions.
- **Information Disclosure**: Mitigated by Content Security Policy (CSP), PII redaction (`PIIRedactor`), and encrypted local storage (`SecureStorage`).
- **Denial of Service**: Mitigated by express-rate-limiters, account lockout policies, and strict JSON body limits.
- **Elevation of Privilege**: Mitigated by server-side RBAC, entity-scope access checks (`requireEntityAccess`, `requireRole`), and client-server role verification.
