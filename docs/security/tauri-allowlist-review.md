# Tauri Allowlist Security Review

**Task:** T03345  
**Date:** 2026-06-08  
**Status:** COMPLETED

---

## Summary

Reviewed Tauri 2.x configuration, capabilities, plugins, and CSP. Found **2 high-risk** and **2 medium-risk** issues.

---

## Permissions Audited

| Permission            | Status        | Risk Level |
| --------------------- | ------------- | ---------- |
| `core:default`        | ✅ Keep       | Low        |
| `shell:allow-execute` | ❌ **REMOVE** | **HIGH**   |
| `fs:default`          | ⚠️ Restrict   | Medium     |
| `fs:allow-read`       | ⚠️ Restrict   | Medium     |
| `fs:allow-write`      | ⚠️ Restrict   | Medium     |
| `dialog:default`      | ✅ Keep       | Low        |
| `sql:default`         | ✅ Keep       | Low        |
| `sql:allow-execute`   | ✅ Keep       | Low        |
| `sql:allow-query`     | ✅ Keep       | Low        |

---

## Plugins Installed

| Plugin                           | Purpose               | Risk     |
| -------------------------------- | --------------------- | -------- |
| `tauri-plugin-dialog`            | File/folder dialogs   | Low      |
| `tauri-plugin-fs`                | Filesystem operations | Medium   |
| `tauri-plugin-shell`             | Shell execution       | **HIGH** |
| `tauri-plugin-sql` (sqlite)      | Local database        | Low      |
| `tauri-plugin-window-state`      | Window persistence    | Low      |
| `tauri-plugin-global-shortcut`   | Keyboard shortcuts    | Low      |
| `tauri-plugin-notification`      | Desktop notifications | Low      |
| `tauri-plugin-updater`           | Auto-updates          | Medium   |
| `tauri-plugin-clipboard-manager` | Clipboard access      | Low      |

---

## CSP Analysis

**Current CSP:**

```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ipc: http://ipc.localhost; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
```

| Directive         | Value                              | Assessment                       |
| ----------------- | ---------------------------------- | -------------------------------- |
| `default-src`     | `'self'`                           | ✅ Good                          |
| `script-src`      | `'self'`                           | ✅ Good - no `unsafe-eval`       |
| `style-src`       | `'self' 'unsafe-inline'`           | ⚠️ Minor - inline styles allowed |
| `img-src`         | `'self' data: https:`              | ⚠️ External HTTPS images allowed |
| `font-src`        | `'self' data:`                     | ✅ Acceptable                    |
| `connect-src`     | `'self' ipc: http://ipc.localhost` | ✅ IPC only                      |
| `frame-ancestors` | `'none'`                           | ✅ Prevents clickjacking         |
| `base-uri`        | `'self'`                           | ✅ Good                          |
| `form-action`     | `'self'`                           | ✅ Good                          |

---

## Findings

### HIGH: shell:allow-execute Capability

**File:** `src-tauri/capabilities/default.json:8`

**Risk:** Allows frontend JavaScript to execute arbitrary shell commands. If CSP is bypassed (XSS, dependency compromise), attacker gains full OS access.

**Impact:** Complete system compromise. Data exfiltration, malware installation, lateral movement.

**Recommendation:** Remove `shell:allow-execute`. FP&A app does not require shell command execution. If specific shell commands are needed, create a Tauri command in Rust instead.

### MEDIUM: Unrestricted Filesystem Access

**File:** `src-tauri/capabilities/default.json:10-12`

**Risk:** `fs:allow-read` and `fs:allow-write` grant broad filesystem access without path restrictions.

**Impact:** Sensitive file exposure (credentials, configs). Write access could corrupt data or inject malicious files.

**Recommendation:** Use scoped permissions:

```json
"fs:allow-read": {
  "allow": [{ "path": "$APPDATA/**" }]
},
"fs:allow-write": {
  "allow": [{ "path": "$APPDATA/**" }]
}
```

### MEDIUM: External Image Loading

**File:** `src-tauri/tauri.conf.json:26`

**Risk:** `img-src https:` allows loading images from any HTTPS endpoint. Potential for tracking pixels or data exfiltration via image URLs.

**Impact:** Privacy leak. Could send data to external server via crafted image request.

**Recommendation:** Remove `https:` if external images are not required, or whitelist specific domains.

### LOW: Inline Styles

**File:** `src-tauri/tauri.conf.json:26`

**Risk:** `style-src 'unsafe-inline'` allows inline styles. Minor XSS vector.

**Impact:** Limited - styles cannot execute code, but can be used for UI redressing.

**Recommendation:** Use nonce-based or hash-based CSP for styles if feasible.

---

## Privilege Escalation Paths

1. **Shell → Full OS:** `shell:allow-execute` + `fs:allow-write` = attacker can download and execute arbitrary binaries
2. **FS Read → Credential Theft:** Unrestricted read access to config files, keychains
3. **SQL Injection → Data Leak:** If frontend passes unsanitized input to SQL, attacker can extract all local data

---

## Recommendations Summary

1. **REMOVE** `shell:allow-execute` from capabilities
2. **SCOPED** filesystem permissions to `$APPDATA/**`
3. **RESTRICT** `img-src` to `'self' data:` (remove `https:`)
4. **AUDIT** all SQL queries for injection vulnerabilities
5. **VERIFY** updater plugin validates signatures before applying updates

---

## References

- [OWASP Tauri Security](https://owasp.org/www-project-tauri/)
- [Tauri Security Model](https://tauri.app/v1/security/)
- [CSP MDN Docs](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
