#!/usr/bin/env node
/**
 * sbom — Generate a Software Bill of Materials.
 *
 * Outputs a JSON SBOM with all production dependencies, their versions,
 * and license information. This is required for enterprise compliance.
 */

import { execSync } from 'child_process';

const ROOT = process.cwd();

console.log('📋 Generating Software Bill of Materials\n');

try {
  const output = execSync('npm ls --omit=dev --json --all 2>/dev/null', {
    cwd: ROOT,
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
  });

  const pkg = JSON.parse(output);
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
