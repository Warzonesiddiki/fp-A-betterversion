#!/usr/bin/env node
/**
 * sbom — Generate a Software Bill of Materials.
 *
 * Outputs a JSON SBOM with all production dependencies, their versions,
 * and license information. This is required for enterprise compliance.
 */

import { spawnSync } from 'child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ROOT = process.cwd();

/**
 * Spawn npm reliably on every dev machine. On Windows there is no `npm`
 * executable — only `npm.cmd`, which Node refuses to spawn without a shell
 * (ENOENT under spawnSync). Prefer the real CLI shipped beside Node
 * (`<node>/node_modules/npm/bin/npm-cli.js`), fall back to bare `npm`.
 */
function runNpm(args, options) {
  const localCli = join(
    dirname(process.execPath),
    'node_modules',
    'npm',
    'bin',
    'npm-cli.js'
  );
  if (existsSync(localCli)) {
    return spawnSync(process.execPath, [localCli, ...args], options);
  }
  return spawnSync('npm', args, options);
}

console.log('📋 Generating Software Bill of Materials\n');

try {
  // npm ls exits non-zero (code 1) for benign tree "problems" such as a
  // transitive dedup mismatch (e.g. glob@11 under archiver-utils via exceljs),
  // while STILL emitting a valid --json payload on stdout. Capture stdout
  // regardless of exit status and only fail if it is not parseable JSON.
  const res = runNpm(['ls', '--omit=dev', '--json', '--all'], {
    cwd: ROOT,
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
  });

  const pkg = JSON.parse(res.stdout || '{}');
  const sbom = {
    schema: 'https://raw.githubusercontent.com/CycloneDX/specification/master/schema/bom-1.4.schema.json',
    specVersion: '1.4',
    serialNumber: `urn:uuid:${crypto.randomUUID()}`,
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      component: {
        type: 'application',
        name: pkg.name || 'finplan-pro',
        version: pkg.version || '1.0.0',
      },
      tools: [{ name: 'finplan-sbom', version: '1.0.0' }],
    },
    components: [],
  };

  const deps = pkg.dependencies || {};
  for (const [name, info] of Object.entries(deps)) {
    if (typeof info === 'object' && info !== null) {
      sbom.components.push({
        type: 'library',
        name,
        version: info.version || 'unknown',
        licenses: info.license ? [{ id: info.license }] : [],
        purl: `pkg:npm/${name}@${info.version || 'unknown'}`,
      });
    }
  }

  console.log(JSON.stringify(sbom, null, 2));
  console.log(`\n✅ SBOM generated with ${sbom.components.length} components`);
} catch (e) {
  console.error(`❌ Failed to generate SBOM: ${e.message}`);
  process.exit(1);
}
