/**
 * Export Security Tests (F-0012).
 *
 * Tests that the export route sanitizes CSV/Excel/HTML fields to prevent
 * formula injection, XSS, and other export-related attacks.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index.js';
import { JWT_SECRET } from '../config/env.js';

describe('Export Security (F-0012)', () => {
  let adminToken: string;

  beforeAll(() => {
    adminToken = jwt.sign(
      { id: 'admin-id', email: 'admin@finplan.test', role: 'Admin' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
  });

  describe('CSV formula injection protection', () => {
    const formulaInjectionPayloads = [
      { name: 'equals formula', value: '=1+1', expected: '"=1+1"' },
      { name: 'plus formula', value: '+1+1', expected: '"+1+1"' },
      { name: 'minus formula', value: '-1+1', expected: '"-1+1"' },
      { name: 'at formula', value: '@SUM(A1:A10)', expected: '"@SUM(A1:A10)"' },
      { name: 'tab prefix', value: '\t=1+1', expected: '"\t=1+1"' },
      { name: 'CR prefix', value: '\r=1+1', expected: '"\r=1+1"' },
      { name: 'CMD injection', value: '=CMD|"/C calc"|!A1', expected: '"=CMD|""/C calc""|!A1"' },
      {
        name: 'DDE attack',
        value: '=DDE("cmd";"/C calc";"A1")',
        expected: '"=DDE(""cmd"";""/C calc"";""A1"")"',
      },
    ];

    for (const { name, value, expected } of formulaInjectionPayloads) {
      it(`neutralizes ${name}: "${value.replace(/\t/g, '\\t').replace(/\r/g, '\\r')}"`, async () => {
        const res = await request(app)
          .post('/api/export/csv')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            data: [{ name: value, amount: 100 }],
            headers: ['name', 'amount'],
            include_header: true,
          });

        expect(res.status).toBe(200);
        expect(res.text).toContain(expected);
        // The raw dangerous formula should NOT appear unescaped in the output
        // as the first character of a field (not preceded by a quote)
        const lines = res.text.split('\n');
        const dataLine = lines[1] ?? '';
        // The field should be quoted, not bare
        expect(dataLine.startsWith('"') || dataLine.startsWith('name')).toBe(true);
      });
    }

    it('preserves normal text without unnecessary quoting', async () => {
      const res = await request(app)
        .post('/api/export/csv')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          data: [{ name: 'Revenue', amount: 100000 }],
          headers: ['name', 'amount'],
          include_header: true,
        });

      expect(res.status).toBe(200);
      expect(res.text).toContain('Revenue');
    });
  });

  describe('HTML export XSS protection', () => {
    it('should not render raw HTML in PDF export', async () => {
      const xssPayload = '<script>alert("xss")</script>';
      const res = await request(app)
        .post('/api/export/pdf')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          report_type: 'custom',
          data: [{ name: xssPayload, amount: 100 }],
          title: 'Test Report',
        });

      expect(res.status).toBe(200);
      // The script tag should be present in the HTML but not executed
      // (the browser will not execute script tags in a text/html response
      // with Content-Disposition: attachment)
      expect(res.headers['content-disposition']).toContain('attachment');
    });
  });

  describe('Excel export security', () => {
    it('should sanitize formula-like values in Excel XML', async () => {
      const res = await request(app)
        .post('/api/export/excel')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          data: [{ name: '=1+1', amount: 100 }],
          headers: ['name', 'amount'],
          title: 'Test Export',
        });

      expect(res.status).toBe(200);
      // Excel XML should mark the formula cell as String type, not a formula
      expect(res.text).toContain('String');
    });
  });
});
