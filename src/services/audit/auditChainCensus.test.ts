/**
 * N2 — audit-chain census invariant (DEC-036).
 *
 * N2 asks that every chain-like path in the tree carry an explicit disposition:
 * either it is the canonical client chain, or it is a bounded local-draft /
 * domain partition, or it is a helper with no product authority, or it is
 * retired. That requirement was previously enforced only by prose in
 * docs/architecture/AUDIT_CHAIN_REACHABILITY.md, so a new hash-chain module
 * could appear and ship with no disposition and nobody would notice.
 *
 * This test makes the census executable. It scans non-test product source for
 * modules that BOTH compute a cryptographic digest AND carry chain-link state.
 * Every hit must appear in CENSUS below with a disposition, a persistence flag,
 * an authority statement and a decision reference. A new file, a deleted file,
 * a stale row, a second "canonical" authority, or a persistence flag that
 * disagrees with the code all fail the build.
 *
 * What this does NOT prove: durability, key custody, external anchoring, or
 * that any of these chains is authoritative server-side. Those remain open in
 * N2 (Q6/O4) and are named per row.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const ROOT = process.cwd();
const SCAN_ROOTS = ['src', 'server/src'];

/** A digest is computed and a previous-link or head is carried in state. */
const HASH_MARKER = /sha-?256|subtle\.digest|createHash/i;
const CHAIN_MARKER = /chainHead|prevChainHash|prevHash|previousHash|entryHash|eventHash/;

type Disposition =
  | 'canonical-client'
  | 'local-draft'
  | 'domain-partition'
  | 'in-memory-helper'
  | 'engine-dependency'
  | 'ui-reader'
  | 'verifier'
  | 'type-only';

interface CensusRow {
  /** What this module is allowed to be. Exactly one row may be canonical-client. */
  readonly disposition: Disposition;
  /** True iff the module allocates a durable namespace (`persist(`). */
  readonly persisted: boolean;
  /** Authority boundary in one sentence — what this chain is NOT. */
  readonly authority: string;
  /** Decision or owner item that fixes the disposition. */
  readonly reference: string;
}

const CENSUS: Readonly<Record<string, CensusRow>> = {
  'src/store/auditTrailStore.ts': {
    disposition: 'canonical-client',
    persisted: true,
    authority:
      'The only canonical client-side audit chain (DEC-025). Not a server authority, not SOX evidence, and not proof ' +
      'of native durability — the frontend has no /api/audit caller (Q6 open, SOX authority O4).',
    reference: 'DEC-025; Q6; O4',
  },
  'src/store/cellLineageStore.ts': {
    disposition: 'local-draft',
    persisted: true,
    authority:
      'Local-draft cell lineage only. No production producer, no external anchor, and a full rewrite can recompute ' +
      'the unkeyed chain; metadata is outside the digest (DEC-029).',
    reference: 'DEC-029',
  },
  'src/store/periodCloseStore.ts': {
    disposition: 'domain-partition',
    persisted: true,
    authority:
      'Period-close control log partitioned per period with append-order checks (DEC-030). Separate from the general ' +
      'trail, unaudited externally, and not SOX evidence (O4 open).',
    reference: 'DEC-030; O4',
  },
  'src/engines/AuditLogEngine.ts': {
    disposition: 'engine-dependency',
    persisted: false,
    authority:
      'In-memory hash chain instantiated only by SOXComplianceEngine. Entries die with the page session, there is no ' +
      'persistence adapter, and it is not the product audit authority (DEC-036).',
    reference: 'DEC-036; Q6; O4',
  },
  'src/services/AuditLogger.ts': {
    disposition: 'in-memory-helper',
    persisted: false,
    authority:
      'Standalone in-memory helper with a snapshot API. No product caller, no SecretsVault wiring, and no persistence ' +
      '(DEC-031).',
    reference: 'DEC-031',
  },
  'src/services/PIIRedactor.ts': {
    disposition: 'in-memory-helper',
    persisted: false,
    authority:
      'Isolated in-memory redaction helper. No product sink, no persistence, and no evidence of product-wide PII ' +
      'coverage (DEC-032).',
    reference: 'DEC-032',
  },
  'src/services/audit/reconstructState.ts': {
    disposition: 'verifier',
    persisted: false,
    authority:
      'Verifier that replays entries supplied by auditTrailStore. It holds no chain of its own and cannot attest to ' +
      'entries it was not given (DEC-025).',
    reference: 'DEC-025',
  },
  'src/components/audit/StateReconstructionPanel.tsx': {
    disposition: 'ui-reader',
    persisted: false,
    authority:
      'Read-only UI over the verifier; displays chain status and never writes or persists audit entries itself ' +
      '(DEC-025).',
    reference: 'DEC-025',
  },
  'src/types/audit.ts': {
    disposition: 'type-only',
    persisted: false,
    authority:
      'Type declarations only — no runtime chain, no persistence, no producer. Name mentions of hash fields are ' +
      'shapes, not behaviour.',
    reference: 'DEC-025',
  },
  'src/types/cell-lineage.ts': {
    disposition: 'type-only',
    persisted: false,
    authority:
      'Type declarations only for the local-draft lineage store — no runtime chain and no persistence of its own ' +
      '(DEC-029).',
    reference: 'DEC-029',
  },
};

function walk(dir: string, acc: string[]): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      walk(full, acc);
    } else if (
      ['.ts', '.tsx'].includes(extname(entry.name)) &&
      !entry.name.includes('.test.') &&
      !entry.name.includes('.bench.') &&
      !entry.name.endsWith('.d.ts')
    ) {
      acc.push(full);
    }
  }
  return acc;
}

function scanChainModules(): Map<string, string> {
  const found = new Map<string, string>();
  for (const root of SCAN_ROOTS) {
    const abs = join(ROOT, root);
    if (!existsSync(abs)) continue;
    for (const file of walk(abs, [])) {
      const source = readFileSync(file, 'utf8');
      if (HASH_MARKER.test(source) && CHAIN_MARKER.test(source)) {
        found.set(relative(ROOT, file).split('\\').join('/'), source);
      }
    }
  }
  return found;
}

const detected = scanChainModules();

describe('N2 audit-chain census', () => {
  it('classifies every non-test module that computes a digest and carries chain state', () => {
    const unclassified = [...detected.keys()].filter((file) => !(file in CENSUS));
    expect(
      unclassified,
      'New audit-chain module(s) without a disposition. Add a CENSUS row naming the authority boundary and the DEC, ' +
        'or retire the module. Prose in AUDIT_CHAIN_REACHABILITY.md is not enforcement:\n' +
        unclassified.join('\n')
    ).toEqual([]);
  });

  it('has no stale rows — every disposition still points at a chain-like module', () => {
    const stale = Object.keys(CENSUS).filter((file) => !detected.has(file));
    expect(
      stale,
      'CENSUS row(s) no longer match a chain-like module. Remove the row in the same commit that removes or ' +
        'refactors the module, so the disposition map cannot drift:\n' +
        stale.join('\n')
    ).toEqual([]);
  });

  it('names exactly one canonical client-side authority', () => {
    const canonical = Object.entries(CENSUS)
      .filter(([, row]) => row.disposition === 'canonical-client')
      .map(([file]) => file);
    expect(
      canonical,
      'DEC-025 selects one canonical client-side chain. A second canonical row needs its own DEC first.'
    ).toEqual(['src/store/auditTrailStore.ts']);
  });

  it('records persistence flags that match the code', () => {
    const mismatched = Object.entries(CENSUS)
      .map(([file, row]) => {
        const source = detected.get(file);
        if (source === undefined) return null; // stale-row test reports it
        const persists = /persist\s*\(/.test(source);
        return persists === row.persisted
          ? null
          : `${file}: row says persisted=${row.persisted}, source persist()=${persists}`;
      })
      .filter((entry): entry is string => entry !== null);
    expect(
      mismatched,
      'Persistence flag disagrees with the module. Fix the row; do not add persistence to fit it.'
    ).toEqual([]);
  });

  it('gives every row an authority statement and a decision reference', () => {
    const incomplete = Object.entries(CENSUS)
      .filter(
        ([, row]) =>
          row.authority.trim().length < 20 || !/DEC-\d+|O\d|Q6|owner/i.test(row.reference)
      )
      .map(([file]) => file);
    expect(
      incomplete,
      'Each row states what the chain is NOT and cites the decision that bounds it.'
    ).toEqual([]);
  });
});
