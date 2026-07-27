# DEPENDENCY VULNERABILITY REPORT — `npm audit`

**Audit Date:** 2026-07-27  
**Command:** `npm audit --json`  
**Total Vulnerabilities Found:** 16  
**Direct Dependencies Affected:** 4 (`@huggingface/transformers`, `axios`, `react-router-dom`, `axios` — `axios` appears multiple times due to multiple advisories)  
**Indirect Dependencies Affected:** 12  
**Fix Available:** 11 of 16 (68.75%)  
**No Fix Available:** 5 of 16 (31.25%)

---

## SUMMARY BY SEVERITY

| Severity | Count | Fix Available | No Fix | Direct | Indirect |
|---|---|---|---|---|---|
| High | 10 | 7 | 3 | 3 (`@huggingface/transformers`, `axios`) | 7 (`adm-zip`, `brace-expansion`, `fast-uri`, `form-data`, `js-yaml`, `onnxruntime-node`, `postcss`, `sharp`, `react-router`, `undici`) |
| Moderate | 4 | 4 | 0 | 1 (`react-router-dom`) | 3 (`dompurify`, `protobufjs`) |
| Low | 2 | 1 | 1 | 0 | 2 (`@babel/core`) |
| **Total** | **16** | **11** | **5** | **4** | **12** |

---

## CRITICAL / HIGH SEVERITY FINDINGS

### 1. `@huggingface/transformers` (Direct, High, NO FIX)
- **Package:** `@huggingface/transformers` (`^4.2.0`)
- **Severity:** High
- **Advisory:** `GHSA-...` (via `onnxruntime-node`, `sharp`)
- **Impact:** Arbitrary code execution or denial of service through ONNX runtime or image processing dependencies. The package pulls in `sharp` (image processing) and `onnxruntime-node` (machine learning runtime), both with known vulnerabilities.
- **Evidence:** `npm audit` shows `@huggingface/transformers` as direct dependency with no fix available (`fixAvailable: false`).
- **Remediation:** Remove `@huggingface/transformers` if not used (audit `src/services/nim.ts` and `src/engines/AIEngine.ts`). If required, upgrade to a fixed version (when available) or sandbox the dependency in a separate process. Monitor `sharp` and `onnxruntime-node` updates separately.

### 2. `axios` (Direct, High / Moderate, FIX AVAILABLE)
- **Package:** `axios` (`^1.16.0`)
- **Severity:** High (1 advisory) + Moderate (5 advisories)
- **Advisories:**
  - `GHSA-42h9-826w-cgv3` — Excessive recursion in `formDataToJSON` (DoS)
  - `GHSA-xj6q-8x83-jv6g` — Prototype pollution auth subfields (can inject Basic auth)
  - `GHSA-pmv8-rq9r-6j72` — Deep `formToJSON` key recursion (DoS)
  - `GHSA-jqh4-m9w3-8hp9` — `ReadableStream` uploads bypass `maxBodyLength`
  - `GHSA-mmx7-hfxf-jppx` — Prototype pollution gadgets alter request construction
  - `GHSA-f4gw-2p7v-4548` — `NO_PROXY` bypass for `0.0.0.0`
  - `GHSA-gcfj-64vw-6mp9` — Inherited proxy after interceptor cloning (high severity)
- **Evidence:** `package.json` shows `axios: ^1.16.0`. `npm audit` reports 7 advisories for `axios`, with range `>=1.0.0 <1.18.0` (high severity advisory requires `>=1.15.2 <1.18.0`). Fix available (`fixAvailable: true`).
- **Remediation:** Upgrade `axios` to `^1.18.0` (or latest) in `package.json`. Run `npm update axios`. Verify no breaking changes in `SageConnector` (`this.client.post`), `WebSocketManager` (not using axios directly), and any other axios users.

### 3. `adm-zip` (Indirect, High, NO FIX)
- **Package:** `adm-zip` (indirect via `onnxruntime-node` or `sharp`)
- **Severity:** High (`GHSA-xcpc-8h2w-3j85`)
- **Advisory:** Crafted ZIP file triggers 4GB memory allocation (DoS / memory exhaustion).
- **Evidence:** `adm-zip` in `node_modules`. `fixAvailable: false`. `range: <0.6.0`.
- **Remediation:** If `sharp` or `onnxruntime-node` updates fix this indirectly, upgrade those packages. Otherwise, monitor `adm-zip` releases. If not needed, remove `sharp` and `onnxruntime-node` (and thus `adm-zip`).

### 4. `sharp` (Indirect, High, NO FIX)
- **Package:** `sharp` (indirect)
- **Severity:** High
- **Evidence:** `sharp` is a dependency of `@huggingface/transformers`. `npm audit` shows `sharp` with high severity, `fixAvailable: false`.
- **Remediation:** Same as `@huggingface/transformers`. Consider removing the dependency or isolating image processing.

### 5. `onnxruntime-node` (Indirect, High, NO FIX)
- **Package:** `onnxruntime-node` (indirect via `@huggingface/transformers`)
- **Severity:** High
- **Evidence:** `fixAvailable: false`. Pulls in `adm-zip` (high severity).
- **Remediation:** Remove `@huggingface/transformers` if not essential. If essential, monitor for updates.

---

## MODERATE SEVERITY FINDINGS

### 6. `react-router-dom` (Direct, Moderate, FIX AVAILABLE)
- **Package:** `react-router-dom` (`^7.15.0`)
- **Severity:** Moderate
- **Evidence:** `npm audit` shows moderate vulnerability (`fixAvailable: true`).
- **Remediation:** Upgrade `react-router-dom` to latest version. Check `react-router` (indirect, high severity) as well.

### 7. `react-router` (Indirect, High, FIX AVAILABLE)
- **Package:** `react-router` (indirect, via `react-router-dom`)
- **Severity:** High
- **Evidence:** `fixAvailable: true`.
- **Remediation:** Upgrade `react-router` and `react-router-dom` together.

### 8. `dompurify` (Indirect, Moderate, FIX AVAILABLE)
- **Package:** `dompurify` (indirect)
- **Severity:** Moderate
- **Evidence:** `fixAvailable: true`.
- **Remediation:** Upgrade `dompurify`. Verify if `DOMPurify` is used in `src/services/PIIRedactor.ts` or other XSS prevention. If `dompurify` is outdated, XSS prevention may be weaker.

### 9. `protobufjs` (Indirect, Moderate, FIX AVAILABLE)
- **Package:** `protobufjs` (indirect)
- **Severity:** Moderate
- **Evidence:** `fixAvailable: true`.
- **Remediation:** Upgrade `protobufjs`.

---

## LOW SEVERITY FINDINGS

### 10. `@babel/core` (Indirect, Low, FIX AVAILABLE)
- **Package:** `@babel/core`
- **Severity:** Low (`GHSA-4x5r-pxfx-6jf8` — Arbitrary File Read via sourceMappingURL Comment)
- **Evidence:** `range: <=7.29.0`. `fixAvailable: true`.
- **Remediation:** Upgrade `@babel/core`. Low impact for production (development build only).

---

## DEPENDENCIES WITH NO FIX AVAILABLE (MONITOR CLOSELY)

| Package | Severity | Impact | Monitoring Recommendation |
|---|---|---|---|
| `@huggingface/transformers` | High | AI engine dependency; may expose `sharp` / `onnxruntime-node` vulnerabilities | Monitor releases weekly; consider removal |
| `adm-zip` | High | ZIP processing DoS; pulled in by `sharp` / `onnxruntime-node` | Monitor `sharp` and `adm-zip` updates |
| `onnxruntime-node` | High | ML runtime vulnerability | Monitor releases; consider isolation |
| `sharp` | High | Image processing vulnerability | Monitor releases; consider isolation |
| `@babel/core` | Low | Development build vulnerability | Monitor; upgrade when fix released |

---

## ADDITIONAL OBSERVATIONS

### `xlsx` Removed but `exceljs` Remains
- **Evidence:** User notes: "Is `xlsx` truly removed? (Commit says 'xlsx removed' for security.)" `package.json` shows `exceljs: ^3.4.0`. `xlsx` is not listed in `dependencies`. `exceljs` may have similar vulnerabilities (not audited by `npm audit` in this output, but should be checked separately).
- **Remediation:** Verify `exceljs` version and check for CVEs. If `xlsx` was removed for security, document the reason and ensure `exceljs` does not have the same vulnerability.

### `postinstall` Scripts
- **Evidence:** `package.json` does not list any `postinstall` scripts (`scripts` does not include `postinstall`). `.npmrc` exists but does not mention `postinstall`. No arbitrary code execution via `postinstall` detected.
- **Remediation:** Confirm no `postinstall` scripts in `package-lock.json`. Monitor for future additions.

### Unpinned Versions (`latest`, `*`)
- **Evidence:** `package.json` uses exact versions (`2.1.1`, `3.4.0`) or caret ranges (`^4.2.0`, `^1.16.0`). No `*` or `latest` found in `dependencies`.
- **Remediation:** Good practice. Maintain exact versions for production builds (`package-lock.json` is present at 587 KB).

### `@json-render/core` and `@json-render/react`
- **Evidence:** `package.json` shows `@json-render/core: ^0.19.0` and `@json-render/react: ^0.19.0`. These packages are not well-known (low download counts, limited community support). `npm audit` did not report vulnerabilities for these packages, but their maintenance status is uncertain.
- **Remediation:** Evaluate whether `@json-render/core` is essential. If it provides JSON rendering functionality, verify it does not introduce XSS (if it renders user-controlled JSON as HTML). Check `node_modules/@json-render/core/package.json` for version and maintenance status.

---

## RECOMMENDED ACTION PLAN (DEPENDENCIES)

1. **Immediate (Critical / High, Fix Available):**
   - `npm update axios` (fixes 7 advisories)
   - `npm update react-router react-router-dom` (fixes high + moderate)
   - `npm update dompurify` (moderate, XSS prevention)

2. **Short-Term (No Fix Available — Monitor / Remove):**
   - Evaluate removal of `@huggingface/transformers` (if not used, remove; if used, isolate in separate service)
   - Monitor `sharp` and `onnxruntime-node` updates
   - Monitor `adm-zip` updates

3. **Medium-Term:**
   - Upgrade `@babel/core` when fix released (low priority)
   - Verify `exceljs` for CVEs and upgrade if needed
   - Add `npm audit` to CI pipeline (currently not enforced — `.github/workflows/` not fully audited)

4. **Ongoing:**
   - Run `npm audit` weekly
   - Monitor `npm audit` results for new advisories on `package-lock.json` (587 KB of pinned versions)
