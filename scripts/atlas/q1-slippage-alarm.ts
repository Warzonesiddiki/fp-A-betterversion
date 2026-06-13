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

function midQDeadline(todayDate: Date): Date {
  // Mid-Q of the CURRENT quarter = 45 days after the 1st of the
  // current quarter's first month. e.g. Q2 (Apr-Jun) → 2027-04-01
  // + 45d = 2027-05-16. By this date, the NEXT quarter's exercise
  // should already be on the team calendar (per T-ATL-014 v0.2 §4).
  const m = Math.floor(todayDate.getUTCMonth() / 3) * 3;
  const y = todayDate.getUTCFullYear();
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
  const scheduleYear = parseInt(SCHEDULE_2027[0]!.date.slice(0, 4), 10);
  const todayYear = t.getUTCFullYear();
  const next = findNextExercise(t);
  const deadline = midQDeadline(t);

  // Year-scoping: the script is configured for one year (2027).
  // - Before the schedule year: "schedule not yet active" — no alarm.
  // - After the schedule year: "schedule expired" — no alarm until reload.
  // - Inside the schedule year: run the Q+1 check normally.
  if (todayYear < scheduleYear) {
    return {
      ok: true,
      today: t.toISOString().slice(0, 10),
      currentQuarter: cq,
      nextQuarter: nq,
      nextExercise: next ? next.name : null,
      scheduledDate: next ? next.date : null,
      midQDeadline: deadline.toISOString().slice(0, 10),
      daysLate: 0,
      slackPinged: false,
      reason: `Schedule for ${scheduleYear} not yet active (today is ${todayYear}).`,
    };
  }
  if (todayYear > scheduleYear) {
    return {
      ok: true,
      today: t.toISOString().slice(0, 10),
      currentQuarter: cq,
      nextQuarter: nq,
      nextExercise: null,
      scheduledDate: null,
      midQDeadline: deadline.toISOString().slice(0, 10),
      daysLate: 0,
      slackPinged: false,
      reason: `Schedule for ${scheduleYear} expired (today is ${todayYear}); ${todayYear} schedule not loaded.`,
    };
  }

  // Inside the schedule year. Alarm fires if past mid-Q of the CURRENT
  // quarter AND the NEXT-quarter exercise is not on the calendar.
  const pastMidQ = t.getTime() >= deadline.getTime();
  const nextQuarterNum = parseInt(nq.slice(1, 2), 10);
  const nextScheduled =
    next !== null &&
    Math.floor(new Date(next.date + 'T00:00:00Z').getUTCMonth() / 3) + 1 === nextQuarterNum;

  const ok = !pastMidQ || nextScheduled;
  const daysLate =
    pastMidQ && !nextScheduled ? Math.floor((t.getTime() - deadline.getTime()) / MS_PER_DAY) : 0;

  const reason = ok
    ? `Q+1 (${nq}) is on calendar or mid-Q deadline not yet reached.`
    : `Q+1 (${nq}) not scheduled by mid-Q deadline ${deadline.toISOString().slice(0, 10)} — ${daysLate} day(s) late.`;

  const text = ok
    ? ''
    : `🚨 *DR tabletop slippage* — ${reason}\n` +
      `Next exercise on record: ${next ? `${next.name} on ${next.date}` : 'NONE — schedule reload required'}`;

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
