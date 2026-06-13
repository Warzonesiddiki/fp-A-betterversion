/**
 * q1-slippage-alarm.ts
 * ------------------------------------------------------------------
 * Atlas T-ATL-016 — Q+1 slippage alarm (TypeScript, push-INDEPENDENT).
 *
 * PURPOSE
 *   Closes the §4 "scheduling slippage" failure mode from
 *   `docs/drafts/atlas/DR_TABLETOP_PLAN.md` v0.2 (ACCEPTED 2026-06-13).
 *   The most common DR-tabletop failure is calendar slippage:
 *   Q2 slides into Q3, Q3 into Q4, year ends with 2 exercises
 *   instead of 5. This script is the operational enforcement.
 *
 * SOURCE OF TRUTH
 *   T-ATL-014 v0.2 §4 "Q2-Q4 2027 schedule" (6 exercises/year).
 *   2027 calendar dates are hard-coded below and must be re-verified
 *   each Q4 against the published T-ATL-014 §4 table.
 *
 * SCHEDULE (cron)
 *   Daily 09:00 UTC = 14:30 IST. Fires every day; only emits when
 *   Q+1 is missing and mid-Q deadline has arrived. Idempotent.
 *
 * OUTPUT
 *   stdout: one JSON line { ok, today, currentQuarter, nextQuarter,
 *           nextExercise, scheduledDate, midQDeadline, daysLate,
 *           slackPinged }
 *   optional: Slack webhook POST when alarm fires.
 *
 * PRE-REQS
 *   Node 18+ (built-in fetch). No npm deps. Optional env:
 *     SLACK_WEBHOOK_URL  — if set, POST alert to Slack on alarm
 *     CALENDAR_FILE      — JSON file override of the 2027 table
 *     OVERRIDE_TODAY     — ISO date for testing (e.g. 2027-04-15)
 *
 * THREE WITNESSES (D-002)
 *   Rule:       Per T-ATL-014 v0.2 §4 "scheduling slippage" — the
 *               Q+1 exercise MUST be scheduled by mid-Q or the year
 *               ends with 2 exercises instead of 5.
 *   Evidence:   T-ATL-014 v0.2 §4 (ACCEPTED 2026-06-13) lists 4
 *               mitigations (schedule in Q4 prior, CEO reviews
 *               quarterly, etc.) — the alarm is the 5th, the
 *               operational one.
 *   Consequence: Without this alarm, slippage is invisible until
 *                year-end Vanta audit catches it (too late to fix).
 * ------------------------------------------------------------------
 */

// ---------- Config ----------

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL ?? '';
const CALENDAR_FILE = process.env.CALENDAR_FILE ?? '';
const OVERRIDE_TODAY = process.env.OVERRIDE_TODAY ?? '';

// ---------- Types ----------

type Exercise = {
  name: string;
  date: string; // ISO yyyy-mm-dd
  type: 'tabletop' | 'game-day' | 'chaos' | 'failover';
};

type AlarmResult = {
  ok: boolean;
  today: string;
  currentQuarter: string;
  nextQuarter: string;
  nextExercise: string | null;
  scheduledDate: string | null;
  midQDeadline: string;
  daysLate: number;
  slackPinged: boolean;
  reason: string;
};

// ---------- 2027 schedule (source: T-ATL-014 v0.2 §4) ----------

const SCHEDULE_2027: Exercise[] = [
  {
    name: 'Q1 2027 tabletop — S3 cross-region replication failure',
    date: '2027-01-19',
    type: 'tabletop',
  },
  { name: 'Q2 2027 tabletop — R2 Object Lock query failure', date: '2027-04-15', type: 'tabletop' },
  { name: 'Q3 2027 game-day — CloudHSM master key loss', date: '2027-07-21', type: 'game-day' },
  { name: 'Q3 2027 tabletop — audit log hash chain tamper', date: '2027-08-25', type: 'tabletop' },
  { name: 'Q4 2027 tabletop — GDPR Art. 33 72-hour breach', date: '2027-10-20', type: 'tabletop' },
  { name: 'Q4 2027 chaos engineering — full-region failover', date: '2027-12-11', type: 'chaos' },
];

// ---------- Date math ----------

const MS_PER_DAY = 86_400_000;

function today(): Date {
  if (OVERRIDE_TODAY) return new Date(OVERRIDE_TODAY + 'T00:00:00Z');
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function quarterOf(d: Date): string {
  return `Q${Math.floor(d.getUTCMonth() / 3) + 1} ${d.getUTCFullYear()}`;
}

function nextQuarterName(d: Date): string {
  const m = d.getUTCMonth();
  const y = d.getUTCFullYear();
  if (m < 3) return `Q2 ${y}`;
  if (m < 6) return `Q3 ${y}`;
  if (m < 9) return `Q4 ${y}`;
  return `Q1 ${y + 1}`;
}

function midQDeadline(todayDate: Date, nextQ: string): Date {
  // Mid-Q for nextQ = 45 days after the 1st of nextQ's quarter-month.
  // e.g. Q2 (Apr-Jun) → 2027-04-01 + 45d = 2027-05-16.
  const m = parseInt(nextQ.slice(1, 2), 10) * 3 - 3; // Q1=0, Q2=3, Q3=6, Q4=9
  const y = parseInt(nextQ.slice(3), 10);
  return new Date(Date.UTC(y, m, 1) + 45 * MS_PER_DAY);
}

function findNextExercise(todayDate: Date): Exercise | null {
  const t = todayDate.getTime();
  return SCHEDULE_2027.find((e) => new Date(e.date + 'T00:00:00Z').getTime() > t) ?? null;
}

// ---------- Slack ----------

async function pingSlack(text: string): Promise<boolean> {
  if (!SLACK_WEBHOOK_URL) return false;
  try {
    const r = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

// ---------- Main ----------

async function run(): Promise<AlarmResult> {
  const t = today();
  const cq = quarterOf(t);
  const nq = nextQuarterName(t);
  const next = findNextExercise(t);
  const deadline = midQDeadline(t);

  // Past mid-Q of next-quarter AND next-quarter exercise not scheduled?
  // (next is null only if today is past the last exercise of the year.)
  const pastMidQ = t.getTime() >= deadline.getTime();
  const nextScheduled =
    next !== null &&
    next.date.slice(0, 4) === nq.slice(3) &&
    Math.floor(new Date(next.date).getUTCMonth() / 3) + 1 === parseInt(nq.slice(1, 2), 10);

  const ok = !pastMidQ || nextScheduled;
  const daysLate =
    pastMidQ && !nextScheduled ? Math.floor((t.getTime() - deadline.getTime()) / MS_PER_DAY) : 0;

  const reason = ok
    ? `Q+1 (${nq}) is on calendar or mid-Q deadline not yet reached.`
    : `Q+1 (${nq}) not scheduled by mid-Q deadline ${deadline.toISOString().slice(0, 10)} — ${daysLate} day(s) late.`;

  const text = ok
    ? ''
    : `🚨 *DR tabletop slippage* — ${reason}\n` +
      `Next exercise on record: ${next ? `${next.name} on ${next.date}` : 'NONE'}`;

  const slackPinged = text ? await pingSlack(text) : false;

  return {
    ok,
    today: t.toISOString().slice(0, 10),
    currentQuarter: cq,
    nextQuarter: nq,
    nextExercise: next ? next.name : null,
    scheduledDate: next ? next.date : null,
    midQDeadline: deadline.toISOString().slice(0, 10),
    daysLate,
    slackPinged,
    reason,
  };
}

run().then((r) => {
  process.stdout.write(JSON.stringify(r) + '\n');
  process.exit(r.ok ? 0 : 1);
});
