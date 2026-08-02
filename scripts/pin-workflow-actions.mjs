#!/usr/bin/env node
/**
 * GAP-7 (F-0024) helper — pin every external GitHub Action `uses:` reference in
 * `.github/workflows/*.yml` to an immutable 40-hex commit SHA.
 *
 * WHY: mutable refs (`@v4`, `@stable`, `@main`) can be re-pointed by whoever
 * controls the action repository. A compromised tag silently changes what runs
 * with our CI credentials. A commit SHA cannot be re-pointed.
 *
 * The resolved SHA map below was produced from the live GitHub API on
 * 2026-08-02 with `gh api repos/<owner>/<repo>/git/ref/tags/<tag>`, dereferencing
 * annotated tag objects to their commit. Each entry keeps the human-readable tag
 * in a trailing comment so upgrades stay reviewable.
 *
 * Usage:
 *   node scripts/pin-workflow-actions.mjs          # rewrite workflows in place
 *   node scripts/pin-workflow-actions.mjs --check  # exit 1 if any ref is unpinned
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const WF_DIR = join(ROOT, '.github', 'workflows');

/** action repo -> { sha, tag } resolved from the GitHub API (2026-08-02). */
export const PINNED_ACTIONS = {
  'actions/checkout': { sha: '11d5960a326750d5838078e36cf38b85af677262', tag: 'v4' },
  'actions/setup-node': { sha: '49933ea5288caeca8642d1e84afbd3f7d6820020', tag: 'v4' },
  'actions/upload-artifact': { sha: 'ea165f8d65b6e75b540449e92b4886f43607fa02', tag: 'v4' },
  'actions/download-artifact': { sha: 'd3f86a106a0bac45b974a628896c90dbdf5c8093', tag: 'v4' },
  'actions/configure-pages': { sha: '1f0c5cde4bc74cd7e1254d0cb4de8d49e9068c7d', tag: 'v4' },
  'actions/upload-pages-artifact': { sha: '56afc609e74202658d3ffba0e8f6dda462b719fa', tag: 'v3' },
  'actions/deploy-pages': { sha: 'd6db90164ac5ed86f2b6aed7e0febac5b3c0c03e', tag: 'v4' },
  'actions/github-script': { sha: 'f28e40c7f34bde8b3046d885e986cb6290c5673b', tag: 'v7' },
  'codecov/codecov-action': { sha: 'b9fd7d16f6d7d1b5d2bec1a2887e65ceed900238', tag: 'v4' },
  'Swatinem/rust-cache': { sha: 'e18b497796c12c097a38f9edb9d0641fb99eee32', tag: 'v2' },
  'tauri-apps/tauri-action': { sha: '84b9d35b5fc46c1e45415bdb6144030364f7ebc5', tag: 'v0' },
  'dtolnay/rust-toolchain': { sha: '4cda84d5c5c54efe2404f9d843567869ab1699d4', tag: 'stable' },
};

const USES_RE = /(uses:\s+)([A-Za-z0-9._-]+\/[A-Za-z0-9._-]+)@([A-Za-z0-9._-]+)/g;

function main() {
  const checkOnly = process.argv.includes('--check');
  if (!existsSync(WF_DIR)) {
    console.error(`No workflow directory at ${WF_DIR}`);
    process.exit(1);
  }

  const files = readdirSync(WF_DIR).filter((f) => /\.ya?ml$/.test(f));
  const unresolved = [];
  let rewritten = 0;

  for (const file of files) {
    const path = join(WF_DIR, file);
    const before = readFileSync(path, 'utf8');
    const after = before.replace(USES_RE, (match, prefix, repo, ref) => {
      if (/^[0-9a-f]{40}$/.test(ref)) return match;
      const pin = PINNED_ACTIONS[repo];
      if (!pin) {
        unresolved.push(`${file}: ${repo}@${ref}`);
        return match;
      }
      return `${prefix}${repo}@${pin.sha} # ${pin.tag}`;
    });

    if (after !== before) {
      if (checkOnly) unresolved.push(`${file}: contains unpinned refs`);
      else {
        writeFileSync(path, after);
        rewritten += 1;
      }
    }
  }

  if (unresolved.length) {
    console.error('Unpinned / unresolvable action references:');
    for (const u of unresolved) console.error(`  - ${u}`);
    process.exit(1);
  }

  console.log(
    checkOnly
      ? `All action refs in ${files.length} workflow file(s) are SHA-pinned.`
      : `Pinned action refs in ${rewritten} of ${files.length} workflow file(s).`
  );
}

main();
