# FINPLAN PRO — AI FLEET SYSTEM PROMPT
## Part 8 of 10 (ADDON): Enterprise Security, Compliance & Data Governance
## Version 5.0.0 | Generated 2026-05-18 | GROUNDED IN ACTUAL CODEBASE

---

## 0. WHY THIS PART EXISTS

FinPlan Pro handles the most sensitive data a company produces: its financials.
A single security breach, compliance failure, or data loss event will permanently
destroy trust. This part defines the security architecture, compliance framework,
and data governance policies that make FinPlan Pro TRUSTWORTHY enough for a CFO
to bet their career on.

---

## 1. SOX COMPLIANCE ARCHITECTURE

### 1.1 Why SOX Matters for FinPlan Pro

Sarbanes-Oxley Act (2002) requires public companies to maintain internal controls
over financial reporting. Any tool used for financial planning MUST support SOX
compliance or it's dead on arrival for enterprise customers.

KEY SECTIONS:
  Section 302: CEO/CFO personally certify accuracy of financial reports
  Section 404: Must assess and report on internal controls annually
  Section 802: Criminal penalties for destroying/altering audit records

### 1.2 SOX-Compliant Audit Trail Requirements

REQUIREMENT 1: IMMUTABILITY
  Every audit entry MUST be frozen (Object.freeze) after creation.
  No engine, store, or API can modify an existing entry.
  Current implementation: CellAuditTrailEngine uses Object.freeze on every entry.
  Status: ✅ IMPLEMENTED

REQUIREMENT 2: COMPLETE CAPTURE
  Every financial data change must be logged with:
    - WHO: userId + userName
    - WHAT: cellId, oldValue, newValue
    - WHEN: ISO 8601 timestamp
    - WHY: reason (required for SOX, optional for non-SOX)
    - HOW: operation type (write/update/delete/bulk)
    - WHERE: source (manual, import, formula, revert)
  Current implementation: CellAuditTrailEngine records all fields.
  Status: ✅ IMPLEMENTED

REQUIREMENT 3: RETENTION
  SOX requires 7-year retention of audit records.
  Current implementation: retentionDays = 2555 (7 years).
  Status: ✅ IMPLEMENTED

REQUIREMENT 4: EXPORTABILITY
  Auditors must be able to export audit trail for review.
  Current implementation: exportCSV() and exportJSON() methods.
  Status: ✅ IMPLEMENTED

REQUIREMENT 5: APPROVAL WORKFLOW
  Material changes should require approval before finalization.
  Current implementation: submitForApproval, approveEntry, rejectEntry.
  Status: ✅ IMPLEMENTED

### 1.3 Tamper-Proof Audit Log Design

```typescript
// Current pattern in CellAuditTrailEngine.ts:
const entry: ExtendedAuditEntry = {
  id: `audit-${++this.idCounter}`,
  cellId,
  oldValue,
  newValue,
  userId,
  userName,
  timestamp: new Date().toISOString(),
  reason,
  operation: 'update',
  dataType,
  source,
  metadata,
};
this.history.push(Object.freeze(entry)); // FROZEN — cannot be mutated

// FUTURE: Add hash chain for tamper detection
interface HashedAuditEntry extends ExtendedAuditEntry {
  previousHash: string;  // SHA-256 of previous entry
  entryHash: string;     // SHA-256 of this entry (excluding this field)
}

// Hash chain verification:
function verifyAuditChain(entries: HashedAuditEntry[]): boolean {
  for (let i = 1; i < entries.length; i++) {
    const expected = sha256(JSON.stringify({
      ...entries[i],
      entryHash: undefined,
      previousHash: entries[i - 1].entryHash,
    }));
    if (entries[i].entryHash !== expected) return false;
    if (entries[i].previousHash !== entries[i - 1].entryHash) return false;
  }
  return true;
}
```

### 1.4 SOX Compliance Checklist for Fleet

```
  □ Every cell change logged (CellAuditTrailEngine.recordWrite/Update/Delete)
  □ Audit entries are immutable (Object.freeze)
  □ 7-year retention configured (retentionDays = 2555)
  □ CSV/JSON export for auditors
  □ Approval workflow for material changes
  □ User identity captured (userId + userName)
  □ Timestamp precision (ISO 8601 with milliseconds)
  □ Reason field required for financial changes
  □ Bulk operations logged as transactions (transactionId)
  □ Data lineage tracking (source field on every entry)
```

---

## 2. GDPR DATA PROTECTION

### 2.1 Why GDPR Matters (Even for Desktop Apps)

GDPR applies if ANY user is in the EU/EEA. Desktop apps that process personal
data (employee names, salaries, emails) must comply.

### 2.2 Right to Erasure (Article 17)

Users can request deletion of their personal data.

IMPLEMENTATION STRATEGY:
  1. Personal data is tagged in the data catalog (DataGovernanceEngine)
  2. "Erase Personal Data" action in Settings → Privacy
  3. Scan all stores for fields tagged as personal
  4. Replace personal fields with anonymized values
  5. Log the erasure action (SOX requires logging WHO erased WHAT)

```typescript
// Pattern for GDPR erasure:
async function erasePersonalData(userId: string): Promise<void> {
  // 1. Find all personal data references
  const personalFields = DataGovernanceEngine.getAssetsByTag('personal');

  // 2. Anonymize in stores
  for (const field of personalFields) {
    await anonymizeField(field.id);
  }

  // 3. Log the erasure (required for SOX audit trail)
  AuditLogEngine.log({
    userId: 'system',
    userName: 'GDPR Compliance',
    action: 'delete',
    resource: 'personal_data',
    resourceId: userId,
    details: 'Personal data erased per GDPR Article 17 request',
  });
}
```

### 2.3 Data Portability (Article 20)

Users can export ALL their data in a machine-readable format.

IMPLEMENTATION:
  - FinPlanFileEngine.saveToFile() exports complete model as JSON
  - ExportEngine exports reports as PDF/Excel/CSV
  - All exports include metadata (creation date, version, user)

### 2.4 Consent Management

```typescript
interface ConsentRecord {
  userId: string;
  consentType: 'data_processing' | 'analytics' | 'export';
  granted: boolean;
  timestamp: string;
  version: string; // consent version (for audit)
}

// Store in settingsStore:
consents: ConsentRecord[];

// Check before processing:
function hasConsent(userId: string, type: string): boolean {
  const consent = settingsStore.consents.find(
    c => c.userId === userId && c.consentType === type
  );
  return consent?.granted ?? false;
}
```

### 2.5 Data Minimization

PRINCIPLE: Only collect and store what's necessary.

RULES:
  - Don't store IP addresses in audit logs (optional field, not required)
  - Don't store user agent strings permanently
  - Don't collect analytics unless user consents
  - Don't store more history than retention policy requires
  - Purge expired sessions automatically (SessionEngine.purgeExpired)

### 2.6 Cross-Border Data Transfer

For offline-first desktop apps, this is IRRELEVANT:
  - Data stays on the user's machine
  - No cloud servers, no cross-border transfers
  - This is a COMPETITIVE ADVANTAGE for GDPR compliance

Marketing message: "Your financial data never leaves your machine.
No cloud. No cross-border transfers. GDPR compliance by design."

---

## 3. ENCRYPTION ARCHITECTURE

### 3.1 Current Implementation (VERIFIED from EncryptionEngine.ts)

```
  Algorithm: AES-256-GCM (authenticated encryption)
  Key derivation: PBKDF2 with 100,000 iterations of SHA-256
  Salt: 16 bytes, random per encryption
  IV: 12 bytes, random per encryption
  Auth tag: Built into GCM ciphertext (tamper detection)
  Semantic security: Same plaintext → different ciphertext (unique salt+IV)
```

### 3.2 File-Level Encryption (.finplan files)

```typescript
// Pattern for saving encrypted .finplan files:
async function saveFinPlanFile(model: Model, password: string): Promise<Blob> {
  const plaintext = FinPlanFileEngine.saveToFile(model);
  const encrypted = await EncryptionEngine.encrypt(plaintext, password);
  return new Blob([JSON.stringify(encrypted)], { type: 'application/finplan' });
}

// Pattern for loading encrypted .finplan files:
async function loadFinPlanFile(file: File, password: string): Promise<Model> {
  const encrypted: EncryptedData = JSON.parse(await file.text());
  const plaintext = await EncryptionEngine.decrypt(encrypted, password);
  return FinPlanFileEngine.loadFromFile(plaintext);
}
```

### 3.3 Field-Level Encryption (Sensitive Store Fields)

```typescript
// Pattern for encrypting sensitive fields in stores:
import { EncryptionEngine } from '@/engines/EncryptionEngine';

// Before persisting:
state.salary = await EncryptionEngine.encryptField(salary, password);
// Result: "enc:eyJjaXBoZXJ0ZXh0IjoiLi4uIn0="

// After loading:
if (EncryptionEngine.isEncrypted(state.salary)) {
  state.salary = await EncryptionEngine.decryptField(state.salary, password);
}

// Detection:
EncryptionEngine.isEncrypted("enc:abc123") // true
EncryptionEngine.isEncrypted(12345)         // false
```

### 3.4 Key Management

```
  PASSWORD STORAGE: NEVER store plaintext passwords
    - Hash with bcryptjs (server-side) or Web Crypto (client-side)
    - bcryptjs is in package.json for server auth

  SESSION KEYS: Store in memory only
    - JWT access tokens in memory (authStore, not localStorage)
    - Encryption keys derived on-demand from user password
    - Never persist derived keys to disk

  OS KEYCHAIN (future):
    - Use Tauri's secure storage plugin when available
    - Until then, require password on every app launch
    - Auto-lock after configurable timeout (SessionEngine)
```

### 3.5 At-Rest Encryption for SQLite

```
  CURRENT: Tauri plugin-sql uses SQLite without encryption
  FUTURE: Enable SQLCipher for database-level encryption
  
  INTERIM: Encrypt sensitive fields before storing in SQLite
    - Use EncryptionEngine.encryptField() for SSN, salary, etc.
    - Store encrypted values in the stores table
    - Decrypt on load using user's password
```

### 3.6 In-Memory Security

```typescript
// Pattern for clearing sensitive data from memory:
function clearSensitiveData(): void {
  // Overwrite sensitive variables with zeros
  if (sensitiveBuffer) {
    sensitiveBuffer.fill(0);
    sensitiveBuffer = null;
  }

  // Clear Zustand store sensitive fields
  authStore.setState({ accessToken: null, refreshToken: null });
}

// Auto-clear on session timeout:
SessionEngine.onExpire(() => {
  clearSensitiveData();
  navigate('/login');
});
```

---

## 4. AUTHENTICATION & SESSION SECURITY

### 4.1 JWT Implementation (VERIFIED from authStore + server auth)

```
  ACCESS TOKEN: Short-lived (15 minutes)
    - Contains: userId, role, entities
    - Stored in memory only (authStore.accessToken)
    - Refreshed automatically by Axios interceptor

  REFRESH TOKEN: Longer-lived (7 days)
    - Stored in memory only (authStore.refreshToken)
    - Used to get new access token
    - Invalidated on logout

  TOKEN FLOW:
    1. User logs in → server returns { accessToken, refreshToken }
    2. authStore stores both in memory (NOT localStorage)
    3. Axios interceptor attaches accessToken to every request
    4. On 401 → interceptor uses refreshToken to get new accessToken
    5. On refresh failure → redirect to login
    6. On logout → clear both tokens from memory
```

### 4.2 Session Timeout (VERIFIED from SessionEngine.ts)

```typescript
// Current implementation:
const DEFAULT_CONFIG: SessionConfig = {
  timeoutMinutes: 30,        // Auto-lock after 30 min inactivity
  maxConcurrentSessions: 5,  // Max 5 sessions per user
  extendOnActivity: true,    // Reset timer on user action
};

// Configurable timeout options:
// 5 minutes  — High security (trading floor)
// 15 minutes — Standard (office environment)
// 30 minutes — Default (balanced)
// 60 minutes — Relaxed (trusted environment)
// Never      — Only for demo/test environments
```

### 4.3 Brute Force Protection

```typescript
// Pattern for login attempt tracking:
interface LoginAttempt {
  identifier: string;  // email or IP
  attempts: number;
  lastAttempt: string;
  lockedUntil?: string;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

function checkBruteForce(identifier: string): { allowed: boolean; retryAfter?: number } {
  const attempt = getLoginAttempt(identifier);
  if (!attempt) return { allowed: true };

  if (attempt.lockedUntil) {
    const lockExpiry = new Date(attempt.lockedUntil);
    if (lockExpiry > new Date()) {
      return {
        allowed: false,
        retryAfter: Math.ceil((lockExpiry.getTime() - Date.now()) / 60000),
      };
    }
    // Lock expired, reset
    clearLoginAttempt(identifier);
    return { allowed: true };
  }

  if (attempt.attempts >= MAX_ATTEMPTS) {
    const lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60000);
    setLockout(identifier, lockedUntil.toISOString());
    return { allowed: false, retryAfter: LOCKOUT_MINUTES };
  }

  return { allowed: true };
}
```

### 4.4 Password Policies

```
  MINIMUM REQUIREMENTS:
    - 12 characters minimum
    - At least 1 uppercase letter
    - At least 1 lowercase letter
    - At least 1 number
    - At least 1 special character (!@#$%^&*)
    - Not in common password list (top 10,000)
    - Not same as last 5 passwords

  VALIDATION (Zod schema):
    const passwordSchema = z.string()
      .min(12, 'Password must be at least 12 characters')
      .regex(/[A-Z]/, 'Must contain uppercase letter')
      .regex(/[a-z]/, 'Must contain lowercase letter')
      .regex(/[0-9]/, 'Must contain number')
      .regex(/[!@#$%^&*]/, 'Must contain special character');
```

---

## 5. RBAC DEEP DIVE

### 5.1 Role Hierarchy (VERIFIED from RBACEngine.ts)

```
  ROLE HIERARCHY (higher number = more authority):
    admin:     100  — Full access to everything
    manager:   80   — Approve budgets, manage team, view all data
    analyst:   60   — Create/edit budgets, run reports, scenarios
    dept_head: 40   — View department data, submit budgets
    viewer:    20   — Read-only access to dashboards and reports
```

### 5.2 Permission Matrix

```
  ┌──────────────┬───────┬─────────┬────────┬──────────┬────────┐
  │ Resource     │ Admin │ Manager │ Analyst│ Dept Head│ Viewer │
  ├──────────────┼───────┼─────────┼────────┼──────────┼────────┤
  │ Budget       │ CRUD  │ CRU+A   │ CRU    │ R(submit)│ R      │
  │ Forecast     │ CRUD  │ CRU     │ CRU    │ R        │ R      │
  │ Scenario     │ CRUD  │ CRU     │ CRU    │ R        │ R      │
  │ Reports      │ CRUD  │ CRU     │ CRU    │ R        │ R      │
  │ GL Data      │ CRUD  │ R       │ R      │ R        │ —      │
  │ Entities     │ CRUD  │ R       │ R      │ R(own)   │ —      │
  │ Users        │ CRUD  │ R       │ —      │ —        │ —      │
  │ Settings     │ CRUD  │ R       │ —      │ —        │ —      │
  │ Audit Trail  │ R     │ R       │ —      │ —        │ —      │
  │ Encryption   │ CRUD  │ —       │ —      │ —        │ —      │
  └──────────────┴───────┴─────────┴────────┴──────────┴────────┘

  C = Create, R = Read, U = Update, D = Delete, A = Approve
  R(submit) = Read own data + Submit for approval
  R(own) = Read own entity data only
```

### 5.3 Cell-Level Security

```typescript
// Pattern for cell-level access control:
function canEditCell(
  userId: string,
  cellId: string,
  context: { entityId: string; accountCode: string; periodId: string }
): boolean {
  // Check base permission
  if (!RBACEngine.hasPermission(userId, 'budget', 'write', context)) {
    return false;
  }

  // Check cell-level override
  const cellPermission = getCellPermission(cellId, userId);
  if (cellPermission === 'deny') return false;
  if (cellPermission === 'allow') return true;

  // Check if cell is locked (approved budget)
  if (isCellLocked(cellId)) return false;

  return true;
}
```

### 5.4 Row-Level Security

```typescript
// Pattern for row-level security (users see only their department):
function filterByDepartment<T extends { departmentId: string }>(
  data: T[],
  userId: string
): T[] {
  const userRole = RBACEngine.getUserRoles(userId);

  // Admin and Manager see everything
  if (userRole.some(r => r.role === 'admin' || r.role === 'manager')) {
    return data;
  }

  // Others see only their department's data
  const userDepartments = getUserDepartments(userId);
  return data.filter(item => userDepartments.includes(item.departmentId));
}
```

### 5.5 Dynamic Permissions (Context-Aware)

```typescript
// Pattern for context-aware permissions:
interface PermissionContext {
  entityId?: string;
  departmentId?: string;
  budgetStatus?: 'draft' | 'submitted' | 'approved' | 'locked';
  isOwner?: boolean;
}

function hasContextualPermission(
  userId: string,
  resource: string,
  action: string,
  context: PermissionContext
): boolean {
  // Base permission check
  if (!RBACEngine.hasPermission(userId, resource, action)) return false;

  // Context-specific rules:
  // 1. Cannot edit locked budgets
  if (context.budgetStatus === 'locked' && action === 'write') return false;

  // 2. Dept heads can only submit their own department's budgets
  if (context.departmentId && !isUserInDepartment(userId, context.departmentId)) {
    if (action !== 'read') return false;
  }

  // 3. Analysts can edit draft budgets but not approved ones
  if (context.budgetStatus === 'approved' && !isManagerOrAbove(userId)) {
    if (action === 'write' || action === 'delete') return false;
  }

  return true;
}
```

---

## 6. EXPORT SECURITY

### 6.1 Watermarking

```typescript
// Pattern for embedding user identity in exports:
interface WatermarkData {
  exportedBy: string;
  exportedAt: string;
  userId: string;
  documentId: string;
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
}

function addPDFWatermark(pdf: jsPDF, watermark: WatermarkData): void {
  // Visible watermark (diagonal, semi-transparent)
  pdf.setFontSize(60);
  pdf.setTextColor(200, 200, 200);
  pdf.text(watermark.classification.toUpperCase(), 105, 148, {
    angle: 45,
    align: 'center',
  });

  // Invisible metadata (embedded in PDF properties)
  pdf.setProperties({
    title: `FinPlan Pro Export - ${watermark.documentId}`,
    author: watermark.exportedBy,
    subject: `Exported by ${watermark.userId} at ${watermark.exportedAt}`,
    keywords: `finplan,${watermark.userId},${watermark.classification}`,
  });
}
```

### 6.2 Export Permissions

```typescript
// Pattern for export access control:
function canExport(userId: string, resource: string, format: string): boolean {
  const role = RBACEngine.getHighestRole(userId);

  // Viewers cannot export
  if (role === 'viewer') return false;

  // Dept heads can only export their department's data
  if (role === 'dept_head') {
    // Additional check: only own department data
    return true; // with row-level filtering applied
  }

  // Analysts and above can export
  return true;
}
```

### 6.3 DLP (Data Loss Prevention)

```typescript
// Pattern for detecting sensitive data in exports:
interface DLPRule {
  id: string;
  name: string;
  pattern: RegExp;
  action: 'block' | 'warn' | 'log';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const DLP_RULES: DLPRule[] = [
  { id: 'ssn', name: 'SSN Detection', pattern: /\b\d{3}-\d{2}-\d{4}\b/, action: 'warn', severity: 'high' },
  { id: 'cc', name: 'Credit Card', pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, action: 'block', severity: 'critical' },
  { id: 'email', name: 'Email Address', pattern: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/, action: 'log', severity: 'low' },
];

function scanForSensitiveData(content: string): DLPRule[] {
  return DLP_RULES.filter(rule => rule.pattern.test(content));
}

// Before export:
function preExportScan(content: string, userId: string): { safe: boolean; violations: DLPRule[] } {
  const violations = scanForSensitiveData(content);
  const blocked = violations.filter(v => v.action === 'block');

  if (blocked.length > 0) {
    AuditLogEngine.log({
      userId,
      action: 'export',
      resource: 'dlp_block',
      details: `Export blocked: detected ${blocked.map(b => b.name).join(', ')}`,
    });
    return { safe: false, violations };
  }

  if (violations.length > 0) {
    AuditLogEngine.log({
      userId,
      action: 'export',
      resource: 'dlp_warn',
      details: `Export warning: detected ${violations.map(v => v.name).join(', ')}`,
    });
  }

  return { safe: true, violations };
}
```

### 6.4 Clipboard Security

```typescript
// Pattern for auto-clearing clipboard after sensitive data copy:
const CLIPBOARD_CLEAR_MS = 5 * 60 * 1000; // 5 minutes

function secureCopyToClipboard(text: string, isSensitive: boolean): void {
  navigator.clipboard.writeText(text);

  if (isSensitive) {
    setTimeout(async () => {
      const current = await navigator.clipboard.readText();
      if (current === text) {
        navigator.clipboard.writeText(''); // Clear if unchanged
      }
    }, CLIPBOARD_CLEAR_MS);
  }
}
```

### 6.5 Screen Capture Prevention

```typescript
// Pattern for detecting screen capture attempts:
// NOTE: Full prevention is not possible in web/desktop apps,
// but we can add deterrence and logging.

function enableScreenCaptureProtection(): void {
  // 1. Add CSS to prevent selection of sensitive areas
  // .no-select { user-select: none; -webkit-user-select: none; }

  // 2. Detect PrintScreen key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'PrintScreen') {
      AuditLogEngine.log({
        userId: getCurrentUserId(),
        action: 'view',
        resource: 'screen_capture',
        details: 'PrintScreen key detected',
      });
      showToast('warning', 'Screen capture detected and logged');
    }
  });

  // 3. Add watermark overlay for sensitive screens
  // (see §6.1 watermarking pattern)
}
```

---

## 7. THREAT MODELING FOR DESKTOP APPS

### 7.1 Attack Vectors

```
  VECTOR 1: FILE TAMPERING
    Attack: Modify .finplan file to inject malicious data
    Risk: Corrupt financial models, inject false data
    Mitigation:
      - AES-256-GCM authentication tag (tamper detection)
      - File integrity checksums (FinPlanFileEngine)
      - Verify checksum on load, reject if mismatch

  VECTOR 2: MEMORY DUMPS
    Attack: Dump process memory to extract sensitive data
    Risk: Leak encryption keys, JWT tokens, financial data
    Mitigation:
      - Clear sensitive data after use (clearSensitiveData)
      - Use Web Crypto API (keys in secure enclave, not JS heap)
      - Auto-lock on inactivity (SessionEngine)

  VECTOR 3: DLL INJECTION (Windows)
    Attack: Inject malicious DLL into Tauri process
    Risk: Full control over application
    Mitigation:
      - Code signing (Windows Authenticode)
      - Tauri's security model (limited IPC surface)
      - Only 1 Tauri command (get_app_info) — minimal attack surface

  VECTOR 4: SUPPLY CHAIN
    Attack: Compromise npm dependency
    Risk: Malicious code in build output
    Mitigation:
      - package-lock.json (pinned versions)
      - npm audit (check for known vulnerabilities)
      - Minimal dependencies (verified in package.json)

  VECTOR 5: BRUTE FORCE
    Attack: Guess user password
    Risk: Unauthorized access
    Mitigation:
      - Account lockout after 5 failed attempts
      - 15-minute lockout duration
      - bcryptjs password hashing (slow by design)
```

### 7.2 Tauri Security Model

```
  TAURI SECURITY ADVANTAGES OVER ELECTRON:
    1. Rust backend — memory safe, no buffer overflows
    2. Minimal IPC surface — only registered commands accessible
    3. Capability-based permissions — explicit allow/deny
    4. No Node.js in renderer — no fs/net access from web content
    5. CSP (Content Security Policy) — prevents XSS escalation

  CURRENT TAURI CAPABILITIES (from capabilities/default.json):
    - core:default — Basic window management
    - shell:allow-execute — Run shell commands (limited)
    - fs:default — File system access (scoped)
    - dialog:default — File/folder dialogs
    - sql:default + sql:allow-execute + sql:allow-query — SQLite access

  SECURITY PRINCIPLE: LEAST PRIVILEGE
    Only grant capabilities that are absolutely necessary.
    Review capabilities before every release.
```

### 7.3 Code Signing

```
  WINDOWS:
    - Sign .msi installer with Authenticode certificate
    - Sign .exe executable
    - Use signtool.exe from Windows SDK
    - Certificate from trusted CA (DigiCert, Sectigo)

  macOS:
    - Sign with Apple Developer ID
    - Notarize with Apple's notary service
    - Staple notarization ticket to .dmg
    - Required for Gatekeeper approval

  LINUX:
    - GPG sign .deb and .rpm packages
    - Publish signing key on website
    - Users verify with gpg --verify
```

### 7.4 Secure Update Process

```typescript
// Pattern for verifying update integrity:
interface UpdateManifest {
  version: string;
  url: string;
  sha256: string;
  signature: string; // Ed25519 signature of sha256
  releaseDate: string;
}

async function verifyAndUpdate(manifest: UpdateManifest): Promise<boolean> {
  // 1. Download update
  const response = await fetch(manifest.url);
  const buffer = await response.arrayBuffer();

  // 2. Verify SHA-256 hash
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  const hashHex = bufferToHex(hash);
  if (hashHex !== manifest.sha256) {
    throw new Error('Update hash mismatch — possible tampering');
  }

  // 3. Verify Ed25519 signature (future: use Tauri updater plugin)
  // const valid = await verifySignature(manifest.sha256, manifest.signature);
  // if (!valid) throw new Error('Invalid update signature');

  // 4. Apply update
  return true;
}
```

---

## 8. DATA GOVERNANCE PATTERNS

### 8.1 Data Classification (VERIFIED from DataGovernanceEngine.ts)

```
  SENSITIVITY LEVELS:
    public       — Marketing materials, published reports
    internal     — Internal budgets, non-sensitive financials
    confidential — Salary data, M&A plans, board materials
    restricted   — SSN, bank accounts, encryption keys

  CLASSIFICATION RULES:
    - Auto-classify based on field type (salary → restricted)
    - User can override classification (with audit trail)
    - Export respects classification (restricted data blocked by default)
    - Search results filtered by user's clearance level
```

### 8.2 Data Quality Scoring

```typescript// Pattern for data quality assessment:
interface DataQualityMetric {
  dimension: 'completeness' | 'accuracy' | 'consistency' | 'timeliness';
  score: number; // 0-100
  issues: string[];
}

function assessDataQuality(dataset: unknown[]): DataQualityMetric[] {
  return [
    {
      dimension: 'completeness',
      score: calculateCompleteness(dataset),
      issues: findMissingFields(dataset),
    },
    {
      dimension: 'accuracy',
      score: calculateAccuracy(dataset),
      issues: findOutOfRangeValues(dataset),
    },
    {
      dimension: 'consistency',
      score: calculateConsistency(dataset),
      issues: findInconsistencies(dataset),
    },
    {
      dimension: 'timeliness',
      score: calculateTimeliness(dataset),
      issues: findStaleData(dataset),
    },
  ];
}
```

### 8.3 Data Lineage Tracking

```typescript// Pattern for tracking data origin:
interface DataLineage {
  cellId: string;
  source: 'manual' | 'import' | 'formula' | 'api' | 'revert';
  sourceDetail?: string; // file path, formula text, API endpoint
  timestamp: string;
  userId: string;
  transformation?: string; // how data was transformed
}

// Usage in CellAuditTrailEngine:
const lineage: DataLineage = {
  cellId: 'A1',
  source: 'import',
  sourceDetail: 'budget_2024.xlsx',
  timestamp: new Date().toISOString(),
  userId: 'user-123',
  transformation: 'Mapped column "Amount" to account "Revenue"',
};

CellAuditTrailEngine.recordWrite('A1', 1000000, 'user-123', 'John', {
  source: 'import',
  metadata: { lineage },
});
```

### 8.4 Retention Policies

```typescript// Pattern for automated data retention:
interface RetentionPolicy {
  dataType: string;
  retentionDays: number;
  archiveAfterDays?: number;
  deleteAfterDays?: number;
  compliance: 'sox' | 'gdpr' | 'internal';
}

const RETENTION_POLICIES: RetentionPolicy[] = [
  { dataType: 'audit_trail', retentionDays: 2555, compliance: 'sox' }, // 7 years
  { dataType: 'session_logs', retentionDays: 365, compliance: 'internal' }, // 1 year
  { dataType: 'user_data', retentionDays: 365, deleteAfterDays: 365, compliance: 'gdpr' },
  { dataType: 'backup', retentionDays: 90, compliance: 'internal' }, // 90 days
  { dataType: 'temp_files', retentionDays: 7, compliance: 'internal' }, // 1 week
];

// Run daily:
function enforceRetentionPolicies(): void {
  for (const policy of RETENTION_POLICIES) {
    const expired = getExpiredData(policy);
    if (policy.deleteAfterDays) {
      deleteData(expired);
    } else {
      archiveData(expired);
    }
  }
}
```

---

## 9. SECURITY TESTING CHECKLIST

```
  BEFORE EVERY RELEASE:

  AUTHENTICATION:
    □ Login with correct credentials succeeds
    □ Login with wrong password fails (no information leakage)
    □ Account locks after 5 failed attempts
    □ Lockout expires after 15 minutes
    □ JWT expires after 15 minutes
    □ Refresh token works correctly
    □ Logout clears all tokens
    □ Session timeout triggers auto-lock

  ENCRYPTION:
    □ .finplan file encrypted with AES-256-GCM
    □ Wrong password fails with clear error
    □ Tampered file detected (GCM auth tag)
    □ Encrypted fields decrypt correctly
    □ isEncrypted() detects encrypted fields

  RBAC:
    □ Admin can access everything
    □ Viewer cannot edit anything
    □ Analyst cannot approve budgets
    □ Dept head sees only own department data
    □ Cell-level security enforced

  AUDIT TRAIL:
    □ Every cell change logged
    □ Audit entries are immutable
    □ CSV export works for auditors
    □ 7-year retention configured
    □ Approval workflow functional

  EXPORT SECURITY:
    □ Watermark present on PDF exports
    □ Export permissions enforced
    □ DLP blocks sensitive data exports
    □ Clipboard auto-clears after 5 min

  INPUT VALIDATION:
    □ Financial numbers validated (finite, non-NaN)
    □ String inputs sanitized (no injection)
    □ File uploads validated (type, size, content)
    □ Zod schemas on all API boundaries
```

---

## 10. QUICK REFERENCE — SECURITY PATTERNS

```
TO ENCRYPT A FILE:
  const encrypted = await EncryptionEngine.encrypt(plaintext, password);
  // Returns: { ciphertext, iv, salt, algorithm: 'AES-GCM' }

TO DECRYPT A FILE:
  const plaintext = await EncryptionEngine.decrypt(encrypted, password);
  // Throws if wrong password or tampered data

TO CHECK PERMISSION:
  if (!RBACEngine.hasPermission(userId, 'budget', 'write', { entityId })) {
    throw new Error('Permission denied');
  }

TO LOG AUDIT ENTRY:
  AuditLogEngine.log({
    userId, userName, action: 'update',
    resource: 'budget', resourceId: budgetId,
    details: 'Updated Q1 forecast',
  });

TO MASK SENSITIVE DATA:
  const masked = DataMaskingEngine.maskSSN(ssn, userRole);
  // Returns: { masked: true, value: 'XXX-XX-1234', originalType: 'ssn' }

TO CLASSIFY DATA:
  DataGovernanceEngine.classifyAsset(assetId, 'confidential');

TO ENFORCE RETENTION:
  CellAuditTrailEngine.enforceRetention(); // Removes entries > 7 years

TO VALIDATE PASSWORD:
  const result = passwordSchema.safeParse(password);
  if (!result.success) { /* show errors */ }
```

---

╔══════════════════════════════════════════════════════════════════════════════╗
║  END OF PART 8                                                              ║
║                                                                              ║
║  This part covers enterprise security, compliance, and data governance.      ║
║  All patterns are grounded in the actual codebase engines.                   ║
║                                                                              ║
║  Parts completed: 1-5 (core), 6-10 (addons)                                ║
║  Remaining: Part 9 (UX Excellence), Part 10 (Go-to-Market)                 ║
╚══════════════════════════════════════════════════════════════════════════════╝