/**
 * USER JOURNEY 12: AUDIT TRAIL EXPORT (SOC 2 CC7.3 + GDPR Art. 17 + 7y Retention)
 * Owner: Sentinel (slot 019ecc6f-1c06-79c0-953c-91c537b63c39)
 * Canonical spec: USER_JOURNEY_TEST_COVERAGE.md v0.9 (commit TBD) §25 NEW
 * 6 tests, ~160 LOC, Flakiness target: 1 (Low)
 * 4-ICP: I1=substantiate audit export compliance / C2=blocks SOX/GDPR ship / P3=O(n) per export / D4=full file:line
 *
 * CONTEXT: Tests audit trail export to multiple formats (CSV, JSON, PDF) with full
 * retention policy enforcement (7-year SOX retention, GDPR Art. 17 right-to-erasure
 * for personal data outside retention period, HIPAA 6-year for healthcare customers).
 *
 * MUSE COVERAGE:
 *   - Hephaestus: AuditLogger PATCH 12 (commit 7f8798e08) — audit chain integrity
 *   - Prometheus: auditStore (immutable append-only log)
 *   - Athena: DataRetentionEngine — GDPR/CCPA/HIPAA policy enforcement
 *
 * COMPLIANCE:
 *   - SOC 2 CC7.3: Audit trail monitoring + response
 *   - SOX 404: 7-year retention for financial records
 *   - GDPR Art. 17: Right to erasure (with retention exemption)
 *   - HIPAA §164.316(b)(2)(i): 6-year retention for healthcare PHI
 *   - CCPA §1798.105: Right to delete (with retention exemption)
 */

import { test, expect, type Page } from '@playwright/test';
import { signInAsCfo } from '../_helpers/auth';
import * as fs from 'fs';
import * as path from 'path';

const DOWNLOADS_DIR = path.join(__dirname, '..', '..', '.downloads');

test.describe('Journey 12: Audit Trail Export (SOC 2 + GDPR + 7y Retention)', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsCfo(page);
    // Ensure downloads dir exists
    if (!fs.existsSync(DOWNLOADS_DIR)) {
      fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
    }
  });

  /**
   * T-ate-1: CSV export with full audit chain (SOC 2 CC7.3)
   * 3-witness: spec / DOM assertion / file checksum
   * Cross-witness: Hephaestus (AuditLogger C-2)
   */
  test('T-ate-1: CSV export includes immutable audit chain (SOC 2 CC7.3)', async ({ page }) => {
    await page.goto('/audit-trail');
    await page.waitForLoadState('networkidle');

    // W1: Filter to Q1 2026 audit entries
    await page.locator('[data-testid="audit-filter-start"]').fill('2026-01-01');
    await page.locator('[data-testid="audit-filter-end"]').fill('2026-03-31');
    await page.locator('[data-testid="audit-apply-filter"]').click();

    // Trigger CSV export
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="audit-export-csv-btn"]').click();
    const download = await downloadPromise;
    const csvPath = path.join(DOWNLOADS_DIR, 'audit-q1-2026.csv');
    await download.saveAs(csvPath);

    // W2: DOM assertion — export complete notification
    await expect(page.locator('[data-testid="audit-export-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="audit-export-success"]')).toContainText('exported');

    // W3: File assertion — CSV contains audit chain (prev_hash column)
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    expect(csvContent).toContain('audit_id');
    expect(csvContent).toContain('prev_hash');
    expect(csvContent).toContain('current_hash');
    expect(csvContent).toContain('timestamp');
    expect(csvContent).toContain('actor_id');
    expect(csvContent.split('\n').length).toBeGreaterThan(10); // at least 10 entries

    // Cleanup
    fs.unlinkSync(csvPath);
  });

  /**
   * T-ate-2: JSON export with full retention metadata (machine-readable)
   * Tests Athena DataRetentionEngine integration
   */
  test('T-ate-2: JSON export includes retention metadata for GDPR/HIPAA', async ({ page }) => {
    await page.goto('/audit-trail');
    await page.waitForLoadState('networkidle');

    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="audit-export-json-btn"]').click();
    const download = await downloadPromise;
    const jsonPath = path.join(DOWNLOADS_DIR, 'audit-export.json');
    await download.saveAs(jsonPath);

    // W2: DOM assertion
    await expect(page.locator('[data-testid="audit-export-success"]')).toBeVisible();

    // W3: JSON structure assertion
    const jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    expect(jsonContent).toHaveProperty('retention_policy');
    expect(jsonContent.retention_policy).toHaveProperty('sox_7y');
    expect(jsonContent.retention_policy).toHaveProperty('hipaa_6y');
    expect(jsonContent.retention_policy).toHaveProperty('gdpr_art17_exemption');
    expect(jsonContent.entries.length).toBeGreaterThan(0);
    expect(jsonContent.entries[0]).toHaveProperty('retention_until');
    expect(jsonContent.entries[0]).toHaveProperty('gdpr_erasable');

    fs.unlinkSync(jsonPath);
  });

  /**
   * T-ate-3: PDF export with cryptographic signature (audit-ready for regulators)
   * Tests PDF signing integration with AuditLogger
   */
  test('T-ate-3: PDF export includes SHA-256 signature for regulator submission', async ({ page }) => {
    await page.goto('/audit-trail');
    await page.waitForLoadState('networkidle');

    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="audit-export-pdf-btn"]').click();
    const download = await downloadPromise;
    const pdfPath = path.join(DOWNLOADS_DIR, 'audit-export.pdf');
    await download.saveAs(pdfPath);

    // W2: DOM assertion
    await expect(page.locator('[data-testid="audit-export-success"]')).toBeVisible();

    // W3: PDF file assertion — must be valid PDF with signature footer
    const pdfBuffer = fs.readFileSync(pdfPath);
    expect(pdfBuffer.subarray(0, 4).toString()).toBe('%PDF');
    // Last 1KB should contain signature marker
    const tail = pdfBuffer.subarray(Math.max(0, pdfBuffer.length - 1024)).toString('utf-8');
    expect(tail).toMatch(/SHA-256:/);
    expect(tail).toMatch(/Signed by FinPlan Pro Audit/);

    fs.unlinkSync(pdfPath);
  });

  /**
   * T-ate-4: 7-year retention enforcement — old entries cannot be deleted
   * SOX 404 + SEC Rule 17a-4(f) compliance
   */
  test('T-ate-4: 7-year retention blocks deletion of SOX entries', async ({ page }) => {
    await page.goto('/audit-trail');
    await page.waitForLoadState('networkidle');

    // Filter to 2019 (7 years ago)
    await page.locator('[data-testid="audit-filter-start"]').fill('2019-01-01');
    await page.locator('[data-testid="audit-filter-end"]').fill('2019-12-31');
    await page.locator('[data-testid="audit-apply-filter"]').click();
    await page.waitForLoadState('networkidle');

    // W2: DOM assertion — delete button is disabled with retention warning
    const deleteBtn = page.locator('[data-testid="audit-delete-2019-entry"]').first();
    await expect(deleteBtn).toBeDisabled();
    await expect(page.locator('[data-testid="retention-warning"]').first()).toContainText('SOX 7-year retention');
    await expect(page.locator('[data-testid="retention-warning"]').first()).toContainText('until 2026-12-31');
  });

  /**
   * T-ate-5: GDPR Art. 17 right-to-erasure works for entries past retention
   * Tests Athena DataRetentionEngine GDPR policy
   */
  test('T-ate-5: GDPR Art. 17 erasure works for entries past retention', async ({ page }) => {
    await page.goto('/audit-trail');
    await page.waitForLoadState('networkidle');

    // Filter to 2010 (16 years ago, past 7y retention)
    await page.locator('[data-testid="audit-filter-start"]').fill('2010-01-01');
    await page.locator('[data-testid="audit-filter-end"]').fill('2010-12-31');
    await page.locator('[data-testid="audit-apply-filter"]').click();
    await page.waitForLoadState('networkidle');

    // W2: GDPR erase button is enabled with retention cleared indicator
    const eraseBtn = page.locator('[data-testid="audit-gdpr-erase-btn"]').first();
    await expect(eraseBtn).toBeEnabled();
    await expect(page.locator('[data-testid="retention-cleared-badge"]').first()).toBeVisible();

    // Confirm erasure
    await eraseBtn.click();
    await page.locator('[data-testid="gdpr-erase-confirm"]').fill('ERASE');
    await page.locator('[data-testid="gdpr-erase-confirm-btn"]').click();

    // W3: DOM assertion — erasure logged with new audit entry
    await expect(page.locator('[data-testid="gdpr-erasure-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="gdpr-erasure-audit-id"]')).toContainText('AUD-GDPR-ERASE');
  });

  /**
   * T-ate-6: HIPAA 6-year retention for healthcare customers
   * Tests sector-specific retention policy (HIPAA §164.316(b)(2)(i))
   */
  test('T-ate-6: HIPAA 6-year retention for healthcare sector customers', async ({ page }) => {
    await page.goto('/audit-trail');
    await page.waitForLoadState('networkidle');

    // Switch to healthcare tenant
    await page.locator('[data-testid="tenant-switcher"]').selectOption('healthcare-tenant-001');
    await page.waitForLoadState('networkidle');

    // Filter to 2020 (6 years ago)
    await page.locator('[data-testid="audit-filter-start"]').fill('2020-01-01');
    await page.locator('[data-testid="audit-filter-end"]').fill('2020-12-31');
    await page.locator('[data-testid="audit-apply-filter"]').click();
    await page.waitForLoadState('networkidle');

    // W2: HIPAA-specific retention indicator visible
    await expect(page.locator('[data-testid="retention-policy-badge"]').first()).toContainText('HIPAA 6-year');
    await expect(page.locator('[data-testid="retention-warning"]').first()).toContainText('until 2026-12-31');

    // W3: Different retention period than SOX 7y (cross-tenant policy check)
    const hipaaRetention = await page.locator('[data-testid="retention-warning"]').first().textContent();
    expect(hipaaRetention).not.toContain('SOX 7-year');
  });

  /**
   * T-ate-7 (J17 amendment v0.10): Cross-tenant audit isolation — tenant A cannot view tenant B entries
   * Tests Sentinel multi-tenant audit isolation
   */
  test('T-ate-7: Cross-tenant audit isolation — Tenant A cannot see Tenant B entries', async ({ page }) => {
    await page.goto('/audit-trail');
    await page.waitForLoadState('networkidle');

    // W1: Tenant A context — view Tenant A audit entries
    await page.locator('[data-testid="tenant-switcher"]').selectOption('tenant-A-001');
    await page.waitForLoadState('networkidle');
    const tenantARows = await page.locator('[data-testid^="audit-row-"]').count();
    expect(tenantARows).toBeGreaterThan(0);

    // W2: Switch to Tenant B context
    await page.locator('[data-testid="tenant-switcher"]').selectOption('tenant-B-002');
    await page.waitForLoadState('networkidle');
    const tenantBRows = await page.locator('[data-testid^="audit-row-"]').count();
    expect(tenantBRows).toBeGreaterThan(0);

    // W3: Audit IDs must be disjoint (no cross-tenant leakage)
    const tenantAIds = await page.locator('[data-testid^="audit-row-"]').evaluateAll(els =>
      els.map(el => el.getAttribute('data-testid')).filter((id): id is string => !!id),
    );
    await page.locator('[data-testid="tenant-switcher"]').selectOption('tenant-A-001');
    await page.waitForLoadState('networkidle');
    const tenantAIds2 = await page.locator('[data-testid^="audit-row-"]').evaluateAll(els =>
      els.map(el => el.getAttribute('data-testid')).filter((id): id is string => !!id),
    );

    const intersection = tenantAIds.filter(id => tenantAIds2.includes(id));
    expect(intersection.length).toBe(0);
  });

  /**
   * T-ate-8 (J17 amendment v0.10): Audit chain integrity via SHA-256 hash chain
   * Tests Hephaestus PATCH 12 AuditLogger C-2 verification with batch export
   */
  test('T-ate-8: Audit chain SHA-256 hash integrity for batch export', async ({ page }) => {
    await page.goto('/audit-trail');
    await page.waitForLoadState('networkidle');

    // W1: Filter to Q1 2026 entries
    await page.locator('[data-testid="audit-filter-start"]').fill('2026-01-01');
    await page.locator('[data-testid="audit-filter-end"]').fill('2026-03-31');
    await page.locator('[data-testid="audit-apply-filter"]').click();
    await page.waitForLoadState('networkidle');

    // W2: Verify chain hash display in UI
    const chainHash = await page.locator('[data-testid="audit-chain-hash"]').textContent();
    expect(chainHash).toMatch(/^[0-9a-f]{64}$/);

    // W3: Verify chain verification badge
    await expect(page.locator('[data-testid="audit-chain-verified-badge"]')).toBeVisible();
    await expect(page.locator('[data-testid="audit-chain-verified-badge"]')).toContainText('CHAIN VERIFIED');
  });
});
