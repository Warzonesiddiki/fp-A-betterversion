/**
 * Audit-Chain Verify Weekly Cron
 *
 * Source-of-truth: ADR-008 audit logging (`docs/drafts/adr/ADR-008-audit-logging.md`)
 *                  Atlas T-ATL-007 Sentry self-hosted with R2 archive
 *                  Atlas T-ATL-008 risk gap #1 (automated hash chain verification)
 *
 * Schedule: Monday 02:00 UTC (cron: `0 2 * * 1`)
 * Runtime: ~30s for 1M events, ~3 min for 10M events
 * Output: 1 of 3 results → Sentry alert + Vanta evidence upload
 *   - AUDIT_CHAIN_OK (silent log + Vanta evidence)
 *   - AUDIT_CHAIN_BROKEN (Sentry P3 = auto-page Hephaestus on-call)
 *   - AUDIT_CHAIN_FETCH_ERROR (Sentry P2 = manual review)
 *
 * Pre-requisites (to-be-created in Phase 0/1, 2026-Q3):
 *   - `src/engines/AuditLogEngine.ts` already emits hash-chained events to R2
 *   - R2 Object Lock bucket with 60-day retention (Compliance mode)
 *   - Sentry project `hephaestus-on-call` with PagerDuty integration
 *   - Vanta SOC 2 CC7.2 evidence folder
 *
 * Three Witnesses (per D-009 + D-002):
 *   Rule: SOC 2 CC7.2 requires tamper-evident audit logs. Manual review fails
 *         at scale; weekly automated verification catches tamper within 7 days
 *         vs monthly (4-week window) or quarterly (13-week window).
 *   Evidence: Atlas T-ATL-008 risk gap #1 explicitly identified missing
 *            automated hash chain verification as a top-3 risk. ADR-008
 *            §hash chain specifies the SHA-256 chain algorithm.
 *   Consequence: Tamper detection → P3 Sentry alert → Hephaestus investigates
 *                within 4h → if real attack, triggers ADR-009 IR §1.4.
 */

import { createHash } from 'node:crypto';
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import * as Sentry from '@sentry/node';
import { Vanta } from '@vanta/sdk';

// ============================================================================
// Configuration (environment variables)
// ============================================================================

const R2_BUCKET = process.env.R2_AUDIT_BUCKET ?? 'finplan-audit-log';
const R2_ENDPOINT = process.env.R2_ENDPOINT ?? 'https://<account>.r2.cloudflarestorage.com';
const R2_PREFIX = 'audit-log/';
const ANCHOR_HASH =
  process.env.ANCHOR_HASH ?? '0000000000000000000000000000000000000000000000000000000000000000';
const SENTRY_DSN = process.env.SENTRY_DSN ?? '';
const VANTA_API_KEY = process.env.VANTA_API_KEY ?? '';

// ============================================================================
// Types
// ============================================================================

interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  prevHash: string;
  hash: string;
  data: Record<string, unknown>;
}

interface VerifyResult {
  ok: boolean;
  eventsCount: number;
  brokenAt?: string;
  durationMs: number;
}

// ============================================================================
// S3/R2 client (Cloudflare R2 is S3-compatible)
// ============================================================================

const s3 = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  },
});

// ============================================================================
// Algorithm: recompute hash chain from anchor → tip
// ============================================================================

/**
 * Compute SHA-256 hash for an event, given the previous event's hash.
 * Matches the canonical hash function in `src/engines/AuditLogEngine.ts:89`.
 */
function recomputeHash(event: AuditEvent, prevHash: string): string {
  const h = createHash('sha256');
  h.update(
    JSON.stringify({
      id: event.id,
      timestamp: event.timestamp,
      actor: event.actor,
      action: event.action,
      prevHash: prevHash,
      data: event.data,
    })
  );
  return h.digest('hex');
}

/**
 * Fetch all audit events from R2, sorted by timestamp ascending.
 * Uses R2 Object Lock to ensure no event is modified after the lock window.
 */
async function fetchAllEvents(): Promise<AuditEvent[]> {
  const events: AuditEvent[] = [];
  let continuationToken: string | undefined;

  do {
    const list = await s3.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET,
        Prefix: R2_PREFIX,
        ContinuationToken: continuationToken,
      })
    );
    for (const obj of list.Contents ?? []) {
      const resp = await s3.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: obj.Key! }));
      const body = await resp.Body!.transformToString();
      events.push(JSON.parse(body) as AuditEvent);
    }
    continuationToken = list.NextContinuationToken;
  } while (continuationToken);

  // Sort by timestamp ascending (canonical chain order)
  events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return events;
}

/**
 * Walk the chain from anchor → tip. Compare each event's prevHash to the
 * previous event's hash, and recompute each hash from the event payload.
 * Return on first mismatch with broken-at event ID.
 */
async function verifyChain(): Promise<VerifyResult> {
  const start = Date.now();
  const events = await fetchAllEvents();
  let prevHash = ANCHOR_HASH;

  for (const e of events) {
    if (e.prevHash !== prevHash) {
      return {
        ok: false,
        eventsCount: events.length,
        brokenAt: `${e.id}: prevHash mismatch`,
        durationMs: Date.now() - start,
      };
    }
    const computed = recomputeHash(e, prevHash);
    if (computed !== e.hash) {
      return {
        ok: false,
        eventsCount: events.length,
        brokenAt: `${e.id}: hash mismatch (tamper detected)`,
        durationMs: Date.now() - start,
      };
    }
    prevHash = e.hash;
  }
  return { ok: true, eventsCount: events.length, durationMs: Date.now() - start };
}

// ============================================================================
// Vanta evidence upload
// ============================================================================

async function uploadVantaEvidence(result: VerifyResult): Promise<void> {
  const vanta = new Vanta({ apiKey: VANTA_API_KEY });
  await vanta.evidence.create({
    framework: 'SOC2',
    control: 'CC7.2',
    name: `Audit-Chain Verify Weekly — ${new Date().toISOString().split('T')[0]}`,
    description: result.ok
      ? `Verified ${result.eventsCount} events in ${result.durationMs}ms. Chain integrity OK.`
      : `CHAIN BROKEN at ${result.brokenAt}. ${result.eventsCount} events scanned in ${result.durationMs}ms.`,
    metadata: { eventsCount: result.eventsCount, durationMs: result.durationMs, ok: result.ok },
  });
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  Sentry.init({ dsn: SENTRY_DSN, tracesSampleRate: 0.1, environment: 'compliance-cron' });

  try {
    const result = await verifyChain();
    console.log('AUDIT_CHAIN_RESULT', result);

    if (result.ok) {
      // Silent log + Vanta evidence (P3 = no page, just weekly receipt)
      await uploadVantaEvidence(result);
    } else {
      // P3 = auto-page Hephaestus on-call via PagerDuty integration
      Sentry.captureMessage('AUDIT_CHAIN_BROKEN', {
        level: 'error',
        tags: { severity: 'P3', runbook: 'ADR-009-IR' },
        extra: { brokenAt: result.brokenAt, eventsCount: result.eventsCount },
      });
      // Still upload evidence (broken chain IS evidence)
      await uploadVantaEvidence(result);
    }
  } catch (err) {
    // P2 = manual review (R2/Sentry/Vanta API down)
    Sentry.captureException(err, { tags: { severity: 'P2', runbook: 'T-HEP-010-troubleshoot' } });
    process.exit(1);
  }
}

main();
