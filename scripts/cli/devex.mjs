#!/usr/bin/env node
 
/**
 * @fileoverview FinPlan Pro Devex CLI — entry point for developer experience tooling
 * (P0A-Devex-CLI / T-3.16 PROMETHEUS, per Lead 2-MIN CHECK-IN CYCLE #2 directive).
 *
 * @description
 * Lightweight command-line interface for the most common FinPlan Pro developer
 * tasks. Each subcommand is implemented in its own sibling file under
 * `scripts/cli/commands/`. This file only:
 *   1. Parses argv[2] as the subcommand name
 *   2. Resolves the matching command module
 *   3. Dispatches argv.slice(3) to that command's `run()` function
 *   4. Prints a help banner if no subcommand is provided
 *
 * Run with `node scripts/cli/devex.mjs <subcommand> [args...]` or, after the
 * `bin` field is wired into `package.json`, `npx fpa <subcommand>`.
 *
 * @version v0.1.0
 * @date 2026-06-18
 * @author Prometheus (slot 019ed745-c890-7860-8a96-0550067e0b3d, MiniMax-M3)
 * @see {@link https://nodejs.org/api/process.html#processargv | Node process.argv}
 *
 * @example
 *   node scripts/cli/devex.mjs --help
 *   node scripts/cli/devex.mjs tsc
 *   node scripts/cli/devex.mjs lint --max-warnings 0
 *   node scripts/cli/devex.mjs canary
 */

import { readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMMANDS_DIR = resolve(__dirname, 'commands');

const BANNER = `FinPlan Pro Devex CLI v0.1.0 (Prometheus · MiniMax-M3)`;

/**
 * List available subcommand names by scanning the commands/ directory for
 * files ending in `.mjs` (excluding the index file).
 *
 * @returns {string[]} Sorted list of subcommand names.
 */
function listCommands() {
  try {
    return readdirSync(COMMANDS_DIR)
      .filter((f) => f.endsWith('.mjs') && f !== 'index.mjs')
      .map((f) => f.replace(/\.mjs$/, ''))
      .sort();
  } catch {
    return [];
  }
}

/**
 * Print the help banner + list of subcommands.
 *
 * @returns {void}
 */
function printHelp() {
  const commands = listCommands();
  console.log(BANNER);
  console.log('');
  console.log('Usage: devex <subcommand> [args...]');
  console.log('');
  console.log('Available subcommands:');
  if (commands.length === 0) {
    console.log('  (none yet — see scripts/cli/commands/)');
  } else {
    for (const name of commands) {
      console.log(`  ${name}`);
    }
  }
  console.log('');
  console.log('Run `devex <subcommand> --help` for subcommand-specific help.');
}

/**
 * Dispatch a subcommand. Loads `commands/<name>.mjs` dynamically and invokes
 * its exported `run(args)` function. If the module does not export `run`,
 * the CLI exits with a clear error message.
 *
 * @param {string} name - Subcommand name (argv[2]).
 * @param {string[]} args - Remaining arguments.
 * @returns {Promise<number>} Exit code (0 for success, non-zero for error).
 */
async function dispatch(name, args) {
  const file = join(COMMANDS_DIR, `${name}.mjs`);
  try {
    statSync(file);
  } catch {
    console.error(`Unknown subcommand: ${name}`);
    console.error(`Run \`devex --help\` to see available subcommands.`);
    return 1;
  }
  try {
    // pathToFileURL is required on Windows because absolute paths like
    // "C:\Users\..." aren't valid ESM specifiers; Node only accepts
    // file:// URLs for local file imports.
    const mod = await import(pathToFileURL(file).href);
    if (typeof mod.run !== 'function') {
      console.error(`Subcommand "${name}" does not export a run() function.`);
      return 1;
    }
    return await mod.run(args);
  } catch (err) {
    console.error(`Subcommand "${name}" failed: ${err?.message ?? err}`);
    if (err?.stack) {
      console.error(err.stack);
    }
    return 1;
  }
}

// ── Entry point ───────────────────────────────────────────────────────────
const [, , subcommand, ...rest] = process.argv;

if (!subcommand || subcommand === '--help' || subcommand === '-h') {
  printHelp();
  process.exit(0);
}

dispatch(subcommand, rest).then(
  (code) => process.exit(code),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
