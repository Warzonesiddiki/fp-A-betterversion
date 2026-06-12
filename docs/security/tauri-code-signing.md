# Tauri Code Signing — Security Audit Report

**Task:** T03359  
**Date:** 2026-06-08  
**Auditor:** censor  
**Status:** PASS (with risks)

---

## Summary

Tauri code signing configuration reviewed. **No private keys committed.** CI/CD properly configured. Placeholder pubkey needs replacement before production.

---

## Findings

### PASS — No Secrets in Source Code

- No `.pem` or `.key` files found in repository
- No hardcoded private keys in `src-tauri/`
- Schema files reference "secret" only in documentation examples

### PASS — CI/CD Signing Config

- `release.yml` uses GitHub Secrets: `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
- Keys injected via environment variables at build time
- No secrets logged or exposed in workflow output

### PASS — .gitignore Coverage

- `.env*` files excluded from git
- No private key patterns committed

### RISK — Placeholder Public Key

**Severity:** MEDIUM  
**Location:** `src-tauri/tauri.conf.json:41`  
**Value:** `dW50cmFja2VkIHB1YmtleSAtIGdlbmVyYXRlIHdpdGggdGF1cmkgc2lnbmVyIGFuZCBzdG9yZSBzZWN1cmVseQ==`

Decoded: `untracked pubkey - generated with tauri signer and stored securely`

**Impact:** Auto-updates will fail signature verification. Users cannot receive updates until real key is configured.

**Fix:** Run `tauri signer generate -w ~/.tauri/finplan-pro.key` and replace pubkey in tauri.conf.json.

### RISK — No Updater Configuration

**Severity:** LOW  
**Location:** `src-tauri/tauri.conf.json`  
**Finding:** No `updater` section in `bundle` config.

**Impact:** Auto-update mechanism not enabled. Users must manually download new versions.

**Recommendation:** Add updater config with endpoint URL when auto-updates desired.

### INFO — Key Rotation Documentation

- `docs/TAURI_PUBKEY_ROTATION.md` exists with proper procedures
- Key rotation steps documented
- CI/CD integration examples provided

---

## Recommendations

1. **Before v1.0.0 release:** Generate real key pair, replace placeholder pubkey
2. **Store private key:** Use GitHub Secrets (already configured) or HSM for production
3. **Key rotation:** Set calendar reminder for annual rotation
4. **Enable updater:** Add `bundle.updater` config when ready for auto-updates

---

## Verdict

| Category               | Status        |
| ---------------------- | ------------- |
| Secrets in code        | ✅ Clean      |
| Private keys committed | ✅ None       |
| CI/CD signing          | ✅ Configured |
| Placeholder pubkey     | ⚠️ Needs fix  |
| Updater config         | ⚠️ Missing    |
| Documentation          | ✅ Present    |

**Overall:** PASS — Ready for staging. Replace pubkey before production release.
