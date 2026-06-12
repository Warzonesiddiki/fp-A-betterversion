<!-- DRAFT v0.1 — awaiting review — Mnemosyne 2026-06-12 -->

# ADR-010: Schema migration strategy (persist + masterStorage + encryption)

> _Status: Accepted · Date: 2026-06-12 · Author: Mnemosyne (Documentation & Architecture) · Cycle: FinPlan Pro Perfection Cycle 2026-06-12_
>
> **Draft note:** This is the canonical 5-ADR set triaged from the Mnemosyne audit. Apollo will move this file to `docs/adr/ADR-010-schema-migration-strategy.md` when staging.
>
> **Replaces:** old ADR-006 (renumbered 2026-06-13 per Path C ADR reorg; new Hephaestus ADRs 006-009 inserted into the sequence)

---

## Context and Problem Statement

FinPlan Pro persists 14 stores to `masterStorage` (see [ADR-005](/docs/adr/ADR-005-custom-masterstorage.md)) and is encrypted-at-rest for PII stores (see ADR-007). The persisted state is the **user's most valuable asset** — a CFO with 2 years of budget data in `dataStore` cannot lose it to a schema change.

We need a single migration strategy that:

1. **Survives a shape change** in any persisted store (added field, renamed field, removed field, type change)
2. **Survives a KDF change** (e.g. PBKDF2 iteration count bump from 100k to 600k)
3. **Survives an encryption algorithm change** (e.g. AES-GCM-128 → AES-GCM-256)
4. **Survives a `masterStorage` change** (e.g. adding cross-tab event normalization)
5. **Survives a `cubeStore` engine version bump** (the cube's internal schema changes)
6. **Is automatic** (the user should not have to manually migrate)
7. **Is auditable** (every migration is logged with a version stamp)
8. **Has a fallback** (if a migration fails, the user is warned and offered "export raw state for support")

We considered four options: status quo (no migration), JSON Schema with auto-evolve, manual migration per store, and a layered version scheme (the chosen approach).

---

## Decision Drivers

- **No data loss.** The user's data is the product. A bad migration is a P0.
- **Bump forward, never break.** Old data migrates forward; new code can read it.
- **Auditable.** Every migration has a version stamp; logs are inspectable.
- **Per-store policy.** Different stores have different migration needs; one policy doesn't fit all.
- **Testable.** Migrations are pure functions; unit-testable.
- **Forward-compatible.** New fields default to safe values; removing a field is a deliberate operation.

---

## Considered Options

1. **Layered version scheme** (chosen) — `masterStorageVersion` + `kdfVersion` + per-store `version` + per-cube `engineVersion`
2. Status quo (no migration)
3. JSON Schema with auto-evolve
4. Manual migration per store with a `migrations/` directory and a runner

---

## Decision Outcome

**Chosen option: "Layered version scheme"** — because it is auditable, per-store, and matches the layered architecture (masterStorage at the bottom, kdfVersion for crypto, per-store version for shape, per-cube engine version for the cube's internal schema).

### The four version layers

```
┌─────────────────────────────────────────┐
│ Layer 4: cubeStore.engineVersion        │  CubeEngine internal schema
│         (e.g. dimension/measure shape)  │  bumped on cube engine refactor
├─────────────────────────────────────────┤
│ Layer 3: per-store.version              │  Store shape (fields, types)
│         (zustand persist({ version }))  │  bumped on every breaking change
├─────────────────────────────────────────┤
│ Layer 2: kdfVersion                     │  Crypto parameters
│         (PBKDF2 iterations, algo)       │  bumped on crypto upgrade
├─────────────────────────────────────────┤
│ Layer 1: masterStorageVersion           │  The wrapper itself
│         (e.g. envelope shape)           │  bumped on masterStorage refactor
└─────────────────────────────────────────┘
```

### Layer 1: `masterStorageVersion`

The `masterStorage` envelope wraps every persisted value:

```typescript
interface StorageEntry<T> {
  masterStorageVersion: 1; // bump on masterStorage.ts breaking changes
  version: number; // per-store version (Layer 3)
  state: T; // the actual state
  iv?: string; // encryption IV (Layer 2 integration)
  timestamp: number; // write time
  kdfVersion?: number; // 1 = 100k iters, 2 = 600k iters (Layer 2)
  engineVersion?: number; // for cubeStore only (Layer 4)
}
```

When `masterStorage.ts` itself changes in a breaking way (e.g. adds a required field, changes the envelope), bump `masterStorageVersion`. The `__resetCache` test helper must be aware of all versions.

### Layer 2: `kdfVersion`

Hephaestus's audit recommends bumping PBKDF2 iterations from 100,000 to 600,000 (OWASP 2023 minimum). When the iteration count changes, the `kdfVersion` is bumped:

```typescript
// src/engines/EncryptionEngine.ts
export interface EncryptedData {
  ciphertext: string; // base64
  iv: string; // base64, 12 bytes
  salt: string; // base64, 16 bytes
  kdfVersion: 1 | 2; // 1 = 100k iters, 2 = 600k iters
  algorithm: 'AES-GCM-256';
}

const KDF_VERSIONS = {
  1: { iterations: 100_000, digest: 'SHA-256' },
  2: { iterations: 600_000, digest: 'SHA-256' },
} as const;

// On decrypt: if kdfVersion < current, transparently re-encrypt
async function decrypt(enc: EncryptedData, passphrase: string): Promise<string> {
  const { iterations, digest } = KDF_VERSIONS[enc.kdfVersion];
  const key = await deriveKey(passphrase, enc.salt, iterations, digest);
  const plaintext = await aesGcmDecrypt(enc.ciphertext, enc.iv, key);

  // Re-encrypt with current kdfVersion
  if (enc.kdfVersion < 2) {
    const reEncrypted = await encrypt(plaintext, passphrase);
    // Caller is responsible for persisting reEncrypted
    return { plaintext, reEncrypted };
  }
  return { plaintext };
}
```

The `reEncrypted` is returned to the caller; the caller (the `dataStore` `set` action) persists it. **No user-visible interruption.**

### Layer 3: per-store `version`

Every persisted store has a `version` field on its `persist` config:

```typescript
export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      accounts: [],
      transactions: [],
      // ...
    }),
    {
      name: 'dataStore',
      version: 3, // ← bump on every breaking change
      storage: createJSONStorage(() => masterStorage),
      migrate: (persistedState, oldVersion) => {
        // Migration chain: 0→1, 1→2, 2→3
        let state = persistedState as any;
        if (oldVersion < 1) {
          // Initial migration
        }
        if (oldVersion < 2) {
          // E.g. add `transactions` field
          state.transactions ??= [];
        }
        if (oldVersion < 3) {
          // E.g. rename `accounts` → `entities`
          if (state.accounts) {
            state.entities = state.accounts;
            delete state.accounts;
          }
        }
        return state;
      },
    }
  )
);
```

The migration is a pure function: `(persistedState, oldVersion) => newState`. It's tested independently of the store.

**Convention: never reuse a version number.** Once `version: 3` ships, you can never ship `version: 3` with a different shape. The migrations are append-only.

### Layer 4: `cubeStore.engineVersion`

The cube is a class instance. Its internal schema (the `Dimension`, `Member`, `Measure` types) can evolve. When that happens, the cube's `engineVersion` is bumped:

```typescript
// src/engines/CubeEngine.ts
export class CubeEngine {
  static VERSION = 4; // ← bump on cube internal schema change
  // ...
}
```

On `cubeStore` rehydration, if the persisted `engineVersion` is less than the current `CubeEngine.VERSION`, the cube is **rebuilt from the raw data** (not migrated in place — a cube is too complex for in-place migration). The raw data is what gets persisted; the cube is reconstructed on load.

```typescript
// In cubeStore migrate
if (oldEngineVersion < CubeEngine.VERSION) {
  // Reconstruct cube from raw data
  state.engine = new CubeEngine(state.rawDimensions, state.rawMeasures, state.rawCells);
  // Re-apply business logic that depends on engine version
  state.engine.migrateFrom(oldEngineVersion);
}
```

### Migration runner (singleton)

A single migration runner coordinates the four layers:

```typescript
// src/utils/migrationRunner.ts
export class MigrationRunner {
  async runIfNeeded(store: string): Promise<void> {
    const entry = masterStorage.peek(store);
    if (!entry) return;

    // Layer 1: masterStorage envelope
    if ((entry as any).masterStorageVersion !== CURRENT_MASTER_STORAGE_VERSION) {
      entry = this.migrateMasterStorage(entry);
    }

    // Layer 2: kdfVersion (only for encrypted stores)
    if (entry.iv && entry.kdfVersion !== CURRENT_KDF_VERSION) {
      entry = await this.migrateKdf(entry);
    }

    // Layer 3: per-store version
    if (entry.version !== CURRENT_STORE_VERSIONS[store]) {
      entry = this.runStoreMigration(store, entry);
    }

    // Layer 4: engineVersion (only for cubeStore)
    if (store === 'cubeStore' && entry.engineVersion !== CubeEngine.VERSION) {
      entry = this.migrateCubeEngine(entry);
    }

    // Persist the migrated state back
    masterStorage.setItem(store, JSON.stringify(entry));
  }
}
```

### Test policy

- **Every migration has a unit test.** Test name: `dataStore.migrate.v1→v2.test.ts`. Asserts old shape → new shape.
- **Migrations are pure.** No side effects, no I/O.
- **Migrations are forward-only.** No down-migration (the user can rollback their code, but the data shape is forward-only).

### Fallback: "Export raw state for support"

If a migration fails (corrupted data, missing key, etc.), the user is shown a modal:

> _We could not automatically migrate your data. Your raw state has been exported to `finplan-pro-export-2026-06-12.json`. Please send this file to support@finplan.pro for manual recovery. Your app will continue with a fresh state._

The export is via `masterStorage.__exportRaw()` which dumps the raw `localStorage` content (encrypted blobs are exported as-is, since the key is also in the file if "remember me" was checked).

---

## Consequences

### Positive

- **No data loss.** Every migration is forward-only and tested.
- **Auditable.** Each entry has a `timestamp` + `masterStorageVersion` + `version` + `kdfVersion` + `engineVersion`.
- **Auto-migrating.** The user does not see the migration; it happens on first load.
- **Per-store policy.** Each store can have its own migration chain; one size doesn't fit all.
- **Testable.** Migrations are pure functions with unit tests.

### Negative

- **Migration code is forever.** Once a migration ships, you can never delete it (a user with `version: 2` data will still need the `2→3` migration on the next upgrade). Code accumulates over time.
- **Migration risk.** A bad migration corrupts the user's data. **All migrations must be reviewed by two engineers + tested against a real-world state export.**
- **Performance.** A migration that touches a large `dataStore` (10k+ transactions) can take ~1 second on first load. The migration runs in a Web Worker to avoid blocking the UI (see ADR-010).
- **Cube engine migration is heavy.** A `cubeStore.engineVersion` bump requires rebuilding the cube from raw data. For a large cube, this can take ~5 seconds. Same Worker mitigation.

### Neutral

- **Versioning convention is per-store.** There is no global "app version" that drives migrations. Each store's `version` is bumped independently. Convention only.
- **Migration logs are not user-visible.** They are in the developer console + the audit log. Support can request the audit log from a user.

---

## Pros and Cons of the Options

### Option 1: Layered version scheme (chosen)

- ✅ Auditable
- ✅ Per-store policy
- ✅ Pure-function migrations
- ❌ Migration code accumulates forever
- ❌ Migration risk (data corruption)

### Option 2: Status quo (no migration)

- ✅ Zero code
- ❌ Cannot ship any breaking change without losing user data
- ❌ A renamed field is a P0 incident

### Option 3: JSON Schema with auto-evolve

- ✅ Declarative
- ❌ Limited expressiveness (rename is awkward)
- ❌ Library overhead
- ❌ JSON Schema is not the right tool for transformation logic

### Option 4: Manual migration with `migrations/` directory

- ✅ Per-file migrations
- ❌ Less auditable (no envelope)
- ❌ No kdfVersion layer
- ❌ No engineVersion layer

---

## Enforcement

- **Linter rule:** `no-restricted-syntax` flagging direct `localStorage.getItem|setItem|removeItem|clear` outside `src/utils/masterStorage.ts` (mirrors ADR-005)
- **Convention:** every persisted store has a `version` field and a `migrate` callback
- **Test policy:** every migration has a unit test, named `*.migrate.v{old}→v{new}.test.ts`
- **CI check:** `masterStorageVersion` + per-store `version` are exported as constants; the migration runner has a "registry" that maps store name → current version, and the CI asserts the registry is in sync with the actual store configs
- **Audit log:** every migration is logged to `logger.info('migrate', { store, oldVersion, newVersion, kdfVersion, masterStorageVersion })`

---

## References

- **`src/utils/masterStorage.ts`** — Layer 1
- **`src/engines/EncryptionEngine.ts:16`** — Layer 2 (PBKDF2 iterations)
- **All 14 persisted stores** — Layer 3 (per-store `version` + `migrate`)
- **`src/engines/CubeEngine.ts`** — Layer 4 (`static VERSION = 4`)
- **ADR-002** — zustand `persist` middleware is the integration point
- **ADR-005** — `masterStorage` envelope is the home of `masterStorageVersion`
- **ADR-007** — `kdfVersion` is the Layer 2 integration point
- **Hephaestus audit 2026-06-12** — P0-#5 dataStore encryption motivates Layer 2; P1 PBKDF2 600k iteration bump motivates the kdfVersion migration
- **Apollo's P0 task** `[Apollo PRE-PUSH P0 #5] dataStore.ts PII leak + DoS` — first deployment of Layer 2 + Layer 3 in production
- **Apollo's P1 task** `[Apollo post-push] Bump PBKDF2 to 600k iterations + kdfVersion migration` — first deployment of Layer 2 migration
- **Mnemosyne audit 2026-06-12** — schema migration is one of the 5 P0 ADRs

---

<!-- /DRAFT v0.1 — Mnemosyne 2026-06-12 -->
