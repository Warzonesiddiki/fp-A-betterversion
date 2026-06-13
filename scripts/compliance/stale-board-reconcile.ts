/**
 * scripts/compliance/stale-board-reconcile.ts
 *
 * Hephaestus 2026-06-13 — T-HEP-011 v0.4 stale-board reconciliation automation
 * (implementation of T-HEP-011 v0.3 §4 spec at docs/drafts/hephaestus/T-HEP-011_v0.3_STALE_BOARD_AUTOMATION.md)
 *
 * PURPOSE
 *   Detects stale records on the team task board (status="pending" or
 *   "in_progress" but corresponding on-disk artifact is SHIPPED with >24h drift)
 *   and reconciles them using the "new task + on-disk truth" workaround pattern.
 *
 * USAGE
 *   pnpm tsx scripts/compliance/stale-board-reconcile.ts --dry-run          # log only
 *   pnpm tsx scripts/compliance/stale-board-reconcile.ts --apply            # log + reconcile
 *   pnpm tsx scripts/compliance/stale-board-reconcile.ts --apply --max-stale=5
 *   pnpm tsx scripts/compliance/stale-board-reconcile.ts --help
 *
 * FLAGS (4)
 *   --dry-run                Log detections without creating reconciliation tasks (default)
 *   --apply                  Create reconciliation tasks via team_task_create
 *   --max-stale=N            Cap on stale records processed per run (default 10)
 *   --log-path=PATH          Audit log destination (default /tmp/stale-board.log)
 *   --help                   Show this help
 *
 * ENV VARS (alternative to flags)
 *   DRY_RUN=true|false       Same as --dry-run / --apply
 *   MAX_STALE_PER_RUN=N      Same as --max-stale=N
 *   LOG_PATH=PATH            Same as --log-path=PATH
 *   HOURS_DRIFT_THRESHOLD=N  Drift threshold in hours (default 24)
 *
 * PUSH-INDEPENDENT (script lives in scripts/compliance/, not src/)
 */

import { glob } from 'node:fs/promises';
import { readFile, stat } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { writeFileSync, appendFileSync } from 'node:fs';

// ─── Types ─────────────────────────────────────────────────────────────────

interface StaleRecord {
  taskId: string;
  taskSubject: string;
  artifactPath: string;
  artifactStatus: string;
  hoursDrift: number;
  recommendedAction: 'create_reconciliation_task';
}

interface BoardTask {
  id: string;
  subject: string;
  status: 'pending' | 'in_progress' | 'completed' | 'deleted';
  updatedAt: number; // epoch ms
}

interface ArtifactMeta {
  path: string;
  status: string; // parsed from YAML frontmatter `Status:` line
  mtimeMs: number;
}

interface ReconciliationResult {
  detected: number;
  reconciled: number;
  skipped: number;
  records: StaleRecord[];
}

interface RuntimeConfig {
  dryRun: boolean;
  maxStale: number;
  logPath: string;
  hoursDriftThreshold: number;
}

// ─── Team Task API (interface + local-file stub) ──────────────────────────

/**
 * Interface for the team task board API. In production this would wrap
 * the actual `team_task_create` / `team_task_list` tools; here we use a
 * local-file stub for testability. See T-HEP-011 v0.3 §4 28th Honest
 * Labeling Muse moment: "the actual team_task_* tools may have different
 * APIs (synchronous vs async, different parameter shapes). The script
 * would need adaptation."
 */
interface TeamTaskApi {
  listTasks(filter: { status: BoardTask['status'][] }): Promise<BoardTask[]>;
  createTask(input: {
    subject: string;
    description: string;
    status: 'completed';
  }): Promise<{ id: string }>;
}

class LocalFileTaskApi implements TeamTaskApi {
  constructor(private boardFilePath: string) {}

  async listTasks(filter: { status: BoardTask['status'][] }): Promise<BoardTask[]> {
    try {
      const raw = await readFile(this.boardFilePath, 'utf-8');
      const all: BoardTask[] = JSON.parse(raw);
      return all.filter((t) => filter.status.includes(t.status));
    } catch (err) {
      // Missing or malformed board file → return empty (not an error in DRY_RUN)
      log(`WARN: could not read board file ${this.boardFilePath}: ${(err as Error).message}`);
      return [];
    }
  }

  async createTask(input: {
    subject: string;
    description: string;
    status: 'completed';
  }): Promise<{ id: string }> {
    const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    appendFileSync(
      this.boardFilePath,
      JSON.stringify({ id, ...input, updatedAt: Date.now() }) + '\n'
    );
    return { id };
  }
}

// ─── YAML frontmatter parser (minimal, no external dep) ────────────────────

function parseFrontmatterStatus(markdown: string): string | null {
  // Match `Status: <value>` inside the first --- ... --- block
  const m = markdown.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!m) return null;
  const statusLine = m[1].split('\n').find((l) => /^Status:\s*/i.test(l));
  if (!statusLine) return null;
  return statusLine.replace(/^Status:\s*/i, '').trim();
}

const SHIPPED_STATUS_PATTERNS = [
  /^SHIPPED/i,
  /^DRAFT v[1-9]/i, // DRAFT v1.0+ treated as final
  /^DRAFT v0\.[5-9]/i, // DRAFT v0.5-v0.9 treated as final
  /^COMPLETED/i,
];

function isShippedStatus(status: string | null): boolean {
  if (!status) return false;
  return SHIPPED_STATUS_PATTERNS.some((p) => p.test(status));
}

// ─── Detection ─────────────────────────────────────────────────────────────

async function detectStaleRecords(
  boardTasks: BoardTask[],
  artifactPaths: string[],
  hoursDriftThreshold: number
): Promise<StaleRecord[]> {
  const stale: StaleRecord[] = [];
  for (const task of boardTasks) {
    const artifactPath = findMatchingArtifact(task.subject, artifactPaths);
    if (!artifactPath) continue;
    let status: string | null;
    let mtimeMs: number;
    try {
      const [content, stats] = await Promise.all([
        readFile(artifactPath, 'utf-8'),
        stat(artifactPath),
      ]);
      status = parseFrontmatterStatus(content);
      mtimeMs = stats.mtimeMs;
    } catch (err) {
      log(`WARN: could not read artifact ${artifactPath}: ${(err as Error).message}`);
      continue;
    }
    if (!isShippedStatus(status)) continue;
    const hoursDrift = (task.updatedAt - mtimeMs) / 3_600_000;
    if (hoursDrift < hoursDriftThreshold) continue;
    stale.push({
      taskId: task.id,
      taskSubject: task.subject,
      artifactPath,
      artifactStatus: status!,
      hoursDrift,
      recommendedAction: 'create_reconciliation_task',
    });
  }
  return stale;
}

function findMatchingArtifact(taskSubject: string, artifactPaths: string[]): string | null {
  // Heuristic: subject contains the basename of an artifact path
  const subj = taskSubject.toLowerCase();
  for (const p of artifactPaths) {
    const base = basename(p).toLowerCase().replace(/\.md$/, '');
    if (subj.includes(base) || base.includes(subj.split(' ')[0] || '')) return p;
  }
  return null;
}

// ─── Reconciliation ────────────────────────────────────────────────────────

async function reconcileStaleRecords(
  stale: StaleRecord[],
  api: TeamTaskApi,
  maxStale: number
): Promise<{ reconciled: number; skipped: number }> {
  let reconciled = 0;
  let skipped = 0;
  for (const record of stale.slice(0, maxStale)) {
    const description =
      `Auto-detected stale record (T-HEP-011 v0.4 stale-board reconcile).\n` +
      `On-disk artifact: ${record.artifactPath} (Status: ${record.artifactStatus}).\n` +
      `Hours drift: ${record.hoursDrift.toFixed(1)}.\n` +
      `Old task ${record.taskId} preserved as known-stale artifact (audit trail integrity).`;
    try {
      await api.createTask({
        subject: `[Stale-Board REC] ${record.taskSubject}`,
        description,
        status: 'completed',
      });
      reconciled++;
      log(`RECONCILED: ${record.taskId} → new task for "${record.taskSubject}"`);
    } catch (err) {
      log(`ERROR: failed to reconcile ${record.taskId}: ${(err as Error).message}`);
      skipped++;
    }
  }
  if (stale.length > maxStale) {
    skipped += stale.length - maxStale;
    log(`SKIPPED: ${stale.length - maxStale} records exceed MAX_STALE=${maxStale}`);
  }
  return { reconciled, skipped };
}

// ─── Logging ───────────────────────────────────────────────────────────────

function log(msg: string, logPath?: string): void {
  const line = `[${new Date().toISOString()}] ${msg}`;

  console.log(line);
  if (logPath) {
    try {
      appendFileSync(logPath, line + '\n');
    } catch {
      // best-effort logging
    }
  }
}

// ─── CLI argument parsing ──────────────────────────────────────────────────

function parseArgs(argv: string[]): RuntimeConfig {
  const cfg: RuntimeConfig = {
    dryRun: process.env.DRY_RUN !== 'false', // default dry-run unless --apply or DRY_RUN=false
    maxStale: Number(process.env.MAX_STALE_PER_RUN) || 10,
    logPath: process.env.LOG_PATH || '/tmp/stale-board.log',
    hoursDriftThreshold: Number(process.env.HOURS_DRIFT_THRESHOLD) || 24,
  };
  for (const arg of argv) {
    if (arg === '--dry-run') cfg.dryRun = true;
    else if (arg === '--apply') cfg.dryRun = false;
    else if (arg.startsWith('--max-stale='))
      cfg.maxStale = Number(arg.slice('--max-stale='.length));
    else if (arg.startsWith('--log-path=')) cfg.logPath = arg.slice('--log-path='.length);
    else if (arg === '--help' || arg === '-h') {
      console.log(`
stale-board-reconcile — T-HEP-011 v0.4 (Hephaestus)

Usage: pnpm tsx scripts/compliance/stale-board-reconcile.ts [flags]

Flags:
  --dry-run                Log detections without creating tasks (default)
  --apply                  Create reconciliation tasks
  --max-stale=N            Cap records processed per run (default 10)
  --log-path=PATH          Audit log destination (default /tmp/stale-board.log)
  --help, -h               Show this help

Env vars: DRY_RUN, MAX_STALE_PER_RUN, LOG_PATH, HOURS_DRIFT_THRESHOLD
      `);
      process.exit(0);
    }
  }
  return cfg;
}

// ─── Entry point ───────────────────────────────────────────────────────────

async function main(): Promise<ReconciliationResult> {
  const cfg = parseArgs(process.argv.slice(2));
  const boardFilePath =
    process.env.BOARD_FILE_PATH || resolve(process.cwd(), 'docs/drafts/.stale-board-fixture.json');
  const artifactGlobs = ['docs/drafts/**/*.md', 'docs/adr/**/*.md', 'docs/**/*.md'];

  log(
    `stale-board-reconcile starting (dry-run=${cfg.dryRun}, max-stale=${cfg.maxStale}, threshold=${cfg.hoursDriftThreshold}h)`,
    cfg.logPath
  );

  const api = new LocalFileTaskApi(boardFilePath);
  const boardTasks = await api.listTasks({ status: ['pending', 'in_progress'] });

  // Glob all candidate artifact paths
  const artifactPaths: string[] = [];
  for (const pattern of artifactGlobs) {
    try {
      const matches = await glob(pattern);
      artifactPaths.push(...matches);
    } catch (err) {
      log(`WARN: glob ${pattern} failed: ${(err as Error).message}`);
    }
  }
  // Deduplicate
  const uniqueArtifacts = Array.from(new Set(artifactPaths));

  const stale = await detectStaleRecords(boardTasks, uniqueArtifacts, cfg.hoursDriftThreshold);
  log(
    `Detected ${stale.length} stale records (threshold ${cfg.hoursDriftThreshold}h).`,
    cfg.logPath
  );

  let reconciled = 0;
  let skipped = 0;
  if (cfg.dryRun) {
    log(
      'DRY-RUN mode: no reconciliation tasks created. Re-run with --apply to reconcile.',
      cfg.logPath
    );
    skipped = stale.length;
  } else {
    const result = await reconcileStaleRecords(stale, api, cfg.maxStale);
    reconciled = result.reconciled;
    skipped = result.skipped;
  }

  const summary: ReconciliationResult = {
    detected: stale.length,
    reconciled,
    skipped,
    records: stale,
  };
  log(`Summary: detected=${stale.length} reconciled=${reconciled} skipped=${skipped}`, cfg.logPath);
  return summary;
}

// Export for programmatic use (e.g., Themis T-TH-002 monitoring integration)
export {
  detectStaleRecords,
  reconcileStaleRecords,
  parseFrontmatterStatus,
  isShippedStatus,
  findMatchingArtifact,
};
export type {
  StaleRecord,
  BoardTask,
  ArtifactMeta,
  TeamTaskApi,
  RuntimeConfig,
  ReconciliationResult,
};

// Run if invoked directly (not imported)
const isDirectInvocation = process.argv[1] && process.argv[1].endsWith('stale-board-reconcile.ts');
if (isDirectInvocation) {
  main().catch((err) => {
    console.error(`FATAL: ${(err as Error).message}`);
    process.exit(1);
  });
}
