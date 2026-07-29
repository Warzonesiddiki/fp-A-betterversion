/**
 * Spreadsheet formula-injection defense (F-0017, hardened for N-0006) —
 * OWASP CSV Injection.
 *
 * Any cell value whose first MEANINGFUL character is one of
 *   =  +  -  @  TAB  CR
 * can execute as a formula/DDE payload when the exported CSV/XLSX is opened
 * in Excel, LibreOffice, or Google Sheets. Every CSV writer, ExcelJS writer,
 * and clipboard export MUST route string cells through this sanitizer.
 *
 * N-0006 — WHY THE PREVIOUS VERSION WAS BYPASSABLE
 * ------------------------------------------------
 * The old test was anchored as /^[=+\-@\t\r]/ (plus a leading-\s variant).
 * Spreadsheet applications IGNORE leading control and Unicode-format
 * characters when parsing a cell, but that regex did not. So:
 *
 *     "\u0000=1+1"   -> isDangerous() === false   -> exported RAW
 *     "\u202E=1+1"   -> isDangerous() === false   -> exported RAW
 *
 * Both still execute on open. The audit reproduced exactly these two.
 *
 * THE FIX
 * -------
 * Compute a "parser view" of the value by stripping every character the
 * spreadsheet parser skips — C0/C1 controls, DEL, zero-width characters,
 * BiDi marks/embeddings/overrides/isolates, BOM, word joiner, and any other
 * Unicode format (Cf) or whitespace character — and test the FIRST character
 * of that view. Detection is therefore based on what the parser sees, not on
 * what the raw byte string starts with.
 *
 * Neutralization prefixes the ORIGINAL value with a single quote (') so the
 * application treats the whole cell as literal text. The original bytes are
 * preserved so legitimate data is never corrupted.
 */

/**
 * Characters a spreadsheet parser skips before deciding "is this a formula?".
 *
 * Built from explicit code-point ranges rather than a character class literal
 * so that variation selectors (U+FE00–U+FE0F) cannot be linted as "combined
 * characters" — they are stripped individually, never combined with a base.
 */
const IGNORABLE_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0x0000, 0x0020], // C0 controls + space (NUL, TAB, LF, CR ...)
  [0x007f, 0x009f], // DEL + C1 controls
  [0x00a0, 0x00a0], // no-break space
  [0x034f, 0x034f], // combining grapheme joiner
  [0x061c, 0x061c], // arabic letter mark
  [0x115f, 0x1160], // hangul fillers
  [0x1680, 0x1680], // ogham space mark
  [0x17b4, 0x17b5], // khmer inherent vowels
  [0x180b, 0x180e], // mongolian selectors / vowel separator
  [0x2000, 0x200f], // spaces, ZWSP, ZWNJ, ZWJ, LRM, RLM
  [0x2028, 0x2029], // line / paragraph separators
  [0x202a, 0x202e], // LRE, RLE, PDF, LRO, RLO
  [0x202f, 0x202f], // narrow no-break space
  [0x205f, 0x206f], // math space, word joiner, invisible ops, isolates
  [0x3000, 0x3000], // ideographic space
  [0x3164, 0x3164], // hangul filler
  [0xfe00, 0xfe0f], // variation selectors
  [0xfeff, 0xfeff], // BOM / zero-width no-break space
  [0xffa0, 0xffa0], // halfwidth hangul filler
  [0xfff9, 0xfffb], // interlinear annotation
];

function isIgnorableCodePoint(cp: number): boolean {
  for (const [lo, hi] of IGNORABLE_RANGES) {
    if (cp >= lo && cp <= hi) return true;
  }
  return false;
}

/** First characters that make a cell execute as a formula. */
const DANGEROUS_FIRST_CHARS = new Set(['=', '+', '-', '@']);

/**
 * The value as the spreadsheet's formula parser effectively sees it:
 * ignorable/invisible characters removed.
 */
function parserView(value: string): string {
  let out = '';
  for (const ch of value) {
    const cp = ch.codePointAt(0);
    if (cp !== undefined && isIgnorableCodePoint(cp)) continue;
    out += ch;
  }
  return out;
}

/**
 * Returns true when a string value would be interpreted as a formula,
 * including when the trigger character is hidden behind control, zero-width,
 * or bidirectional-override characters (N-0006).
 */
export function isDangerousSpreadsheetCell(value: string): boolean {
  if (typeof value !== 'string' || value.length === 0) return false;
  const view = parserView(value);
  if (view.length === 0) return false;
  return DANGEROUS_FIRST_CHARS.has(view[0]!);
}

/**
 * Neutralizes a single cell. Non-strings (numbers, booleans, null) are
 * returned unchanged — they cannot carry formula payloads.
 */
export function sanitizeSpreadsheetCell<T>(value: T): T | string {
  if (typeof value !== 'string') return value;
  if (!isDangerousSpreadsheetCell(value)) return value;
  return `'${value}`;
}

/**
 * Variant used by CSV/text writers where every cell is serialized as a
 * string. Always returns a string and neutralizes dangerous content.
 */
export function sanitizeSpreadsheetText(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return isDangerousSpreadsheetCell(str) ? `'${str}` : str;
}
