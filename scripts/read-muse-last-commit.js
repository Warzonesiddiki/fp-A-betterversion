#!/usr/bin/env node
/**
 * read-muse-last-commit.js — MUSE-LAST-COMMIT CACHE reader
 *
 * Per NEVER-AGAIN RULE e.ix.5.m (CATCH #190) — Codif 35 v0.4
 * Spec: docs/specs/muse-last-commit-cache.md
 * Cache: .openhands/muse-last-commit.json
 *
 * USAGE:
 *   node scripts/read-muse-last-commit.js check <muse-name> [--window=<minutes>]
 *     Exit 0 (SKIP)     — Muse committed within the window; CAVEMAN should NOT re-dispatch
 *     Exit 1 (DISPATCH) — Muse is idle longer than the window; CAVEMAN should dispatch
 *     Exit 2 (NO_DATA)  — Muse is not in the cache (never committed, or new spawn)
 *     Exit 3 (ERROR)    — Cache file missing/corrupted
 *
 *   node scripts/read-muse-last-commit.js list [--window=<minutes>]
 *     Prints a TSV table of every Muse with status, age, and last commit SHA.
 *     Exit 0 always.
 *
 *   node scripts/read-muse-last-commit.js show <muse-name>
 *     Prints the full cache entry for a Muse (JSON).
 *
 * EXAMPLES:
 *   # CAVEMAN 19/19 cycle integration (one Muse)
 *   node scripts/read-muse-last-commit.js check hera && echo "skip hera" || echo "dispatch hera"
 *
 *   # List all Muses for a CAVEMAN cycle review
 *   node scripts/read-muse-last-commit.js list
 *
 *   # Stricter window (30 min) for hot phases
 *   node scripts/read-muse-last-commit.js list --window=30
 *
 * OWNER: Hera (initial implementation) → Atlas (long-term owner per file-scope).
 * The script lives in `scripts/` per Leader direction; future edits should coordinate
 * with Atlas to keep `scripts/bundle-check.js`, `rename_parts.js`, `check-coverage.js`
 * styling consistent (ESM, no transpilation, no external deps).
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ESM equivalent of __dirname: resolve relative to this file's URL.
// fileURLToPath + dirname gives a proper OS-native path that fs.readFileSync
// can consume on Windows (with spaces in the path) and Unix.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CACHE_PATH = join(__dirname, '..', '.openhands', 'muse-last-commit.json');
const DEFAULT_WINDOW_MIN = 60;

/**
 * Parse argv of the form: <command> [arg] [--window=N]
 * Supports a single --window= prefix flag.
 */
function parseArgs(argv) {
  const args = {
    command: argv[2],
    arg: argv[3],
    window: DEFAULT_WINDOW_MIN,
  };
  for (const a of argv.slice(4)) {
    const m = a.match(/^--window=(\d+)$/);
    if (m) args.window = parseInt(m[1], 10);
  }
  return args;
}

/** Load and parse the cache file. Exit 3 on failure. */
function loadCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.error(`ERROR: cache file not found at ${CACHE_PATH}`);
    } else {
      console.error(`ERROR: cannot read cache at ${CACHE_PATH}: ${e.message}`);
    }
    process.exit(3);
  }
}

/** Compute age in minutes (rounded) from an ISO-8601 timestamp. */
function ageMinutes(isoTimestamp) {
  const t = new Date(isoTimestamp).getTime();
  if (Number.isNaN(t)) return null;
  return Math.round((Date.now() - t) / 60000);
}

/** check command — single Muse decision. */
function checkMuse(cache, museName, windowMin) {
  const key = museName.toLowerCase();
  const entry = cache.muses?.[key];
  if (!entry) {
    console.log(`NO_DATA\t${museName}\tnot in cache`);
    return 2;
  }
  const ageMin = ageMinutes(entry.lastCommitAt);
  if (ageMin === null) {
    console.log(`NO_DATA\t${museName}\tinvalid lastCommitAt: ${entry.lastCommitAt}`);
    return 2;
  }
  if (ageMin < windowMin) {
    console.log(`SKIP\t${museName}\t${ageMin}m ago\twithin ${windowMin}m window\t${entry.lastCommit}`);
    return 0;
  }
  console.log(`DISPATCH\t${museName}\t${ageMin}m ago\texceeds ${windowMin}m window\t${entry.lastCommit}`);
  return 1;
}

/** list command — TSV table of all Muses. */
function listMuses(cache, windowMin) {
  const names = Object.keys(cache.muses || {});
  if (names.length === 0) {
    console.log('NO_MUSES_IN_CACHE');
    return 0;
  }
  console.log(['MUSE', 'STATUS', 'AGE', 'WINDOW', 'LAST_COMMIT', 'SUBJECT'].join('\t'));
  for (const name of names.sort()) {
    const entry = cache.muses[name];
    const ageMin = ageMinutes(entry.lastCommitAt);
    const status = ageMin === null ? 'NO_DATA' : ageMin < windowMin ? 'SKIP' : 'DISPATCH';
    const subject = (entry.lastCommitSubject || '').replace(/\t/g, ' ').slice(0, 60);
    console.log(
      [name, status, `${ageMin}m`, `${windowMin}m`, entry.lastCommit, subject].join('\t')
    );
  }
  return 0;
}

/** show command — pretty-print one Muse's full entry. */
function showMuse(cache, museName) {
  const entry = cache.muses?.[museName.toLowerCase()];
  if (!entry) {
    console.log(`NO_DATA\t${museName}`);
    return 2;
  }
  console.log(JSON.stringify({ muse: museName.toLowerCase(), ...entry }, null, 2));
  return 0;
}

// ---------- main ----------
const args = parseArgs(process.argv);
const cache = loadCache();

switch (args.command) {
  case 'check': {
    if (!args.arg) {
      console.error('Usage: check <muse-name> [--window=<minutes>]');
      process.exit(1);
    }
    process.exit(checkMuse(cache, args.arg, args.window));
    break;
  }
  case 'list': {
    process.exit(listMuses(cache, args.window));
    break;
  }
  case 'show': {
    if (!args.arg) {
      console.error('Usage: show <muse-name>');
      process.exit(1);
    }
    process.exit(showMuse(cache, args.arg));
    break;
  }
  default: {
    console.error('Usage: check <muse> | list | show <muse>');
    console.error('Flags: --window=<minutes>  (default 60)');
    process.exit(1);
  }
}
