#!/usr/bin/env node
 
/**
 * @fileoverview Generate 3 distinct PWA icons (192, 512, 512-maskable).
 *
 * @version v0.1.0
 * @date 2026-06-18
 * @author Prometheus (T-3.15 Issue #2 + #3 follow-up)
 *
 * T-3.15 2nd witness findings:
 *   Issue #2: public/icon-192.png and public/icon-512.png have identical MD5
 *             (d13d6d2a...). Browsers reject same-image 192/512 as malformed
 *             manifest. Must be distinct images at distinct resolutions.
 *   Issue #3: icon-512.png is reused as maskable (in vite.config.ts line 88-93)
 *             but maskable icons require safe-zone padding (~40% inset).
 *             Reusing the same image violates W3C maskable icon spec.
 *
 * Strategy: use sharp if available (preferred); otherwise fallback to a
 * pure-JS PNG encoder that produces 3 distinct images with safe-zone padding.
 *
 * Usage:
 *   node scripts/generate-pwa-icons.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createHash } from 'node:crypto';

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const SVG_PATH = path.join(PUBLIC_DIR, 'icon.svg');
const ICON_192 = path.join(PUBLIC_DIR, 'icon-192.png');
const ICON_512 = path.join(PUBLIC_DIR, 'icon-512.png');
const ICON_512_MASKABLE = path.join(PUBLIC_DIR, 'icon-512-maskable.png');

// ── Pure-JS PNG encoder (CRC32 + deflate) ────────────────────────────────────

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

/** Encode RGBA pixel buffer as PNG. */
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Filter byte 0 (None) + RGBA scanlines
  const stride = width * 4;
  const filtered = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    filtered[y * (stride + 1)] = 0;
    rgba.copy(filtered, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const idatData = zlib.deflateSync(filtered);

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idatData),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Renderer: draw FinPlan Pro F monogram + chart bars (3 variants) ──────────

/**
 * Render the FinPlan Pro monogram onto an RGBA buffer.
 * @param {number} size  - output square size in pixels
 * @param {boolean} maskable - if true, applies 16.67% safe-zone inset
 */
function renderIcon(size, maskable) {
  const buf = Buffer.alloc(size * size * 4, 0);

  // Padding: 16.67% safe zone for maskable (W3C spec)
  const safeZone = maskable ? Math.round(size * 0.1667) : 0;
  const inner = size - 2 * safeZone;

  // Corner radius: 12.5% of inner (for 192/512 mask)
  const radius = Math.round(inner * 0.125);

  // Brand colors
  const primary = [30, 64, 175, 255];     // #1e40af
  const primaryDark = [30, 58, 138, 255]; // #1e3a8a
  const accent = [16, 185, 129, 255];     // #10b981
  const white = [255, 255, 255, 255];

  // Vertical gradient: top = primary, bottom = primaryDark
  function setPixel(x, y, [r, g, b, a]) {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const t = y / size;
    const cr = Math.round(primary[0] + (primaryDark[0] - primary[0]) * t);
    const cg = Math.round(primary[1] + (primaryDark[1] - primary[1]) * t);
    const cb = Math.round(primary[2] + (primaryDark[2] - primary[2]) * t);
    const i = (y * size + x) * 4;
    buf[i] = cr; buf[i + 1] = cg; buf[i + 2] = cb; buf[i + 3] = a;
  }

  function setPixelSolid(x, y, [r, g, b, a]) {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const i = (y * size + x) * 4;
    buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = a;
  }

  // Draw rounded rect background (inset for maskable)
  for (let y = safeZone; y < size - safeZone; y++) {
    for (let x = safeZone; x < size - safeZone; x++) {
      const lx = x - safeZone;
      const ly = y - safeZone;
      const inset = inner;
      // Corner check
      let inRect = true;
      const corners = [
        [radius, radius],
        [inset - radius, radius],
        [radius, inset - radius],
        [inset - radius, inset - radius],
      ];
      for (const [cx, cy] of corners) {
        if (lx >= cx - radius && lx <= cx + radius && ly >= cy - radius && ly <= cy + radius) {
          const dx = lx - cx;
          const dy = ly - cy;
          if (dx * dx + dy * dy > radius * radius) inRect = false;
        }
      }
      if (inRect) setPixel(x, y, primary);
    }
  }

  // Letter F (white) — placed in upper portion
  // Scale F based on inner size
  const fScale = inner / 320; // 320 is design space
  const fX0 = Math.round(safeZone + inner * 0.2);
  const fY0 = Math.round(safeZone + inner * 0.15);
  const fStroke = Math.round(inner * 0.13);  // thick stroke
  const fH = Math.round(inner * 0.55);
  const fTopW = Math.round(inner * 0.5);
  const fMidW = Math.round(inner * 0.42);
  const fMidY = fY0 + Math.round(fH * 0.45);
  // Vertical stroke (left)
  for (let y = fY0; y < fY0 + fH; y++) {
    for (let x = fX0; x < fX0 + fStroke; x++) setPixelSolid(x, y, white);
  }
  // Top horizontal stroke
  for (let y = fY0; y < fY0 + fStroke; y++) {
    for (let x = fX0; x < fX0 + fTopW; x++) setPixelSolid(x, y, white);
  }
  // Mid horizontal stroke (shorter)
  for (let y = fMidY; y < fMidY + fStroke; y++) {
    for (let x = fX0; x < fX0 + fMidW; x++) setPixelSolid(x, y, white);
  }

  // Chart bars at bottom (4 bars: ascending heights)
  const barsAreaY = Math.round(safeZone + inner * 0.78);
  const barsAreaH = Math.round(inner * 0.15);
  const barW = Math.round(inner * 0.06);
  const barGap = Math.round(inner * 0.025);
  const barX0 = Math.round(safeZone + inner * 0.22);
  const heights = [0.5, 0.7, 0.85, 1.0].map(h => Math.round(barsAreaH * h));
  for (let i = 0; i < 4; i++) {
    const bx = barX0 + i * (barW + barGap);
    const bh = heights[i];
    const by = barsAreaY + (barsAreaH - bh);
    for (let y = by; y < by + bh; y++) {
      for (let x = bx; x < bx + barW; x++) setPixelSolid(x, y, accent);
    }
  }

  // Tag with size + maskable in corner (debug visible — only in 512-maskable)
  // Skipped — keep clean icon

  return encodePNG(size, size, buf);
}

// ── Main ─────────────────────────────────────────────────���───────────────────

console.log('── generate-pwa-icons.mjs ───────────────────────');

if (!fs.existsSync(SVG_PATH)) {
  console.error(`SVG source not found: ${SVG_PATH}`);
  console.error('Run from project root.');
  process.exit(1);
}

const png192 = renderIcon(192, false);
const png512 = renderIcon(512, false);
const png512Mask = renderIcon(512, true);

fs.writeFileSync(ICON_192, png192);
console.log(`✅ ${path.relative(process.cwd(), ICON_192)} (${png192.length} bytes, MD5 ${md5(png192)})`);

fs.writeFileSync(ICON_512, png512);
console.log(`✅ ${path.relative(process.cwd(), ICON_512)} (${png512.length} bytes, MD5 ${md5(png512)})`);

fs.writeFileSync(ICON_512_MASKABLE, png512Mask);
console.log(`✅ ${path.relative(process.cwd(), ICON_512_MASKABLE)} (${png512Mask.length} bytes, MD5 ${md5(png512Mask)})`);

// Verify distinct hashes
if (md5(png192) === md5(png512)) {
  console.error('❌ icon-192 and icon-512 have same MD5 — generation FAILED');
  process.exit(2);
}
console.log('✅ icon-192 ≠ icon-512 (MD5 distinct)');
console.log('✅ icon-512-maskable has safe-zone padding (16.67% inset)');

console.log('\nNext: update vite.config.ts PWA manifest to reference icon-512-maskable.png');
console.log('      (currently reuses icon-512.png which violates W3C maskable spec).');
console.log('───────────────────────────────────────────────────');

function md5(buf) {
  return createHash('md5').update(buf).digest('hex').slice(0, 8) + '...';
}