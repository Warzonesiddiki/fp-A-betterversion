// TEMP tool: iterate until no @typescript-eslint/no-unused-vars remain.
import fs from 'node:fs';
import { execSync } from 'node:child_process';

function findImportStatement(lines, lineIdx) {
  let st = -1;
  for (let i = lineIdx; i >= 0 && i >= lineIdx - 40; i--) {
    const s = lines[i].trim();
    if (/^import\b/.test(s)) { st = i; break; }
    if (!s) continue;
    if (/^[A-Za-z_$][\w$]*(\s+as\s+[A-Za-z_$][\w$]*)?\s*,?\s*$/.test(s)) continue;
    if (/^type\s+[A-Za-z_$][\w$]*(\s+as\s+[A-Za-z_$][\w$]*)?\s*,?\s*$/.test(s)) continue;
    if (/^[{}]\s*$/.test(s)) continue;
    if (/^}\s*from\s*['"]/.test(s)) continue;
    return null;
  }
  if (st < 0) return null;
  let en = st;
  let depth = 0;
  for (let i = st; i < lines.length; i++) {
    en = i;
    for (const ch of lines[i]) {
      if (ch === '{' || ch === '(') depth++;
      else if (ch === '}' || ch === ')') depth--;
      else if (ch === ';' && depth <= 0) return { st, en };
    }
  }
  return { st, en };
}

function removeSpecifier(stmtText, name) {
  let text = stmtText;
  const headRe = new RegExp(`^\\s*import\\s+(type\\s+)?(?:\\*\\s+as\\s+)?${name}\\s*(?:,\\s*|from\\s*)`);
  if (headRe.test(text)) {
    const m = headRe.exec(text);
    text = text.slice(0, m.index) + 'import ' + (m[1] ?? '') + text.slice(m.index + m[0].length);
    if (/^import\s+(type\s+)?from\s/.test(text)) return null;
  } else {
    const namedRe = new RegExp(
      `([{,}]\\s*)(?:type\\s+)?(?:[A-Za-z_$][\\w$]*\\s+as\\s+)?${name}(\\s*(?:as\\s+[A-Za-z_$][\\w$]*)?)(?=\\s*[,}])`
    );
    const m = namedRe.exec(text);
    if (m) {
      const before = m[1];
      const afterMatch = text.slice(m.index + m[0].length);
      if (before.includes('{')) {
        text = text.slice(0, m.index + 1) + (afterMatch.match(/^\s*,/) ? afterMatch.replace(/^\s*,\s*/, ' ') : afterMatch.replace(/^\s*/, ''));
      } else {
        const beforeText = text.slice(0, m.index + before.length);
        text = afterMatch.match(/^\s*,/)
          ? beforeText + afterMatch.replace(/^\s*,\s*/, '')
          : beforeText.replace(/,\s*$/, ' ') + afterMatch;
      }
    } else {
      return text;
    }
  }
  text = text.replace(/\{\s*\}/, '');
  if (/^import\s+(type\s+)?\s*from\s/.test(text)) return null;
  return text;
}

function removeObjElement(lineText, name) {
  const objRe = new RegExp(`([{,}]\\s*)(?:[A-Za-z_$][\\w$]*\\s*:\\s*)?${name}(\\s*=\\s*[^,}]*)?(?=\\s*[,}])`);
  const m2 = objRe.exec(lineText);
  if (!m2) return null;
  const after = lineText.slice(m2.index + m2[0].length);
  if (m2[1].includes('{')) {
    return lineText.slice(0, m2.index + 1) + (after.match(/^\s*,/) ? after.replace(/^\s*,\s*/, ' ') : after.replace(/^\s*/, ''));
  }
  const before = lineText.slice(0, m2.index + m2[1].length);
  return after.match(/^\s*,/) ? before + after.replace(/^\s*,\s*/, '') : before.replace(/,\s*$/, ' ') + after;
}

function enclosingDestructure(lines, lineIdx) {
  for (let i = lineIdx - 1; i >= Math.max(0, lineIdx - 10); i--) {
    const s = lines[i].trim();
    if (/^(const|let|var)\s*\{/.test(s)) return 'obj';
    if (/^(const|let|var)\s*\[/.test(s)) return 'arr';
    if (/^(const|let|var)\s+[A-Za-z_$]/.test(s)) return null;
    if (/^[A-Za-z_$][\w$]*(\s*:\s*[A-Za-z_$][\w$]*)?(\s*=\s*[^,}]+)?,?\s*$/.test(s)) continue;
    if (/^[{}[\]]\s*,?\s*$/.test(s)) continue;
    if (!s) continue;
    return null;
  }
  return null;
}

function collectEdits(data) {
  const edits = {};
  for (const res of data) {
    const f = res.filePath;
    for (const m of res.messages) {
      if (m.ruleId !== '@typescript-eslint/no-unused-vars') continue;
      const nameM = m.message.match(/'([^']+)'/);
      if (!nameM) continue;
      const name = nameM[1];
      if (name.startsWith('_')) continue;
      (edits[f] ??= []).push({
        line: m.line - 1,
        name,
        type: m.message.includes('only used as a type') ? 'type-only' : 'unused',
      });
    }
  }
  return edits;
}

let pass = 0;
while (pass < 6) {
  pass++;
  try {
    execSync('node node_modules/eslint/bin/eslint.js src --max-warnings 0 --format json 2>/dev/null > /tmp/lint-pass.json', { stdio: 'ignore' });
  } catch { /* eslint exits 1 on warnings — JSON still written */ }
  const data = JSON.parse(fs.readFileSync('/tmp/lint-pass.json', 'utf8'));
  const edits = collectEdits(data);
  const total = Object.values(edits).flat().length;
  console.log(`pass ${pass}: ${total} unused-vars errors`);
  if (total === 0) break;

  for (const [f, list] of Object.entries(edits)) {
    const orig = fs.readFileSync(f, 'utf8');
    const lines = orig.split('\n');
    const sorted = [...list].sort((a, b) => b.line - a.line);
    for (const e of sorted) {
      const imp = findImportStatement(lines, e.line);
      if (imp) {
        const text = lines.slice(imp.st, imp.en + 1).join('\n');
        if (e.type === 'type-only' && !text.includes(`type ${e.name}`)) {
          const re = new RegExp(`([{,}]\\s*)${e.name}(\\s*(?:as\\s+[A-Za-z_$][\\w$]*)?)(?=\\s*[,}])`);
          if (re.test(text)) {
            const ntext = text.replace(re, '$1type $2');
            lines.splice(imp.st, imp.en - imp.st + 1, ...ntext.split('\n'));
          }
          continue;
        }
        const ntext = removeSpecifier(text, e.name);
        if (ntext === null) {
          lines.splice(imp.st, imp.en - imp.st + 1);
        } else if (ntext !== text) {
          lines.splice(imp.st, imp.en - imp.st + 1, ...ntext.split('\n'));
        }
        continue;
      }

      const lineText = lines[e.line] ?? '';
      if (e.type === 'type-only') continue;

      // element line inside a multiline destructure
      if (lineText.includes(e.name) && /^\s*[A-Za-z_$][\w$]*(\s*:\s*[A-Za-z_$][\w$]*)?(\s*=\s*[^,}]+)?,?\s*$/.test(lineText)) {
        const kind = enclosingDestructure(lines, e.line);
        if (kind === 'obj') { lines.splice(e.line, 1); continue; }
        if (kind === 'arr') {
          lines[e.line] = lineText.replace(new RegExp(`\\b${e.name}\\b`), `_${e.name}`);
          continue;
        }
      }

      // destructured object param `({ value }) =>`
      if (/\(\s*\{/.test(lineText) && lineText.includes(e.name)) {
        const nl = removeObjElement(lineText, e.name);
        if (nl !== null) { lines[e.line] = nl; continue; }
      }

      const isParamLike = /\(|=>|catch\s*\(|,\s*$|^\s*\)/.test(lineText) &&
        !/^\s*(const|let|var)\s/.test(lineText);
      if (isParamLike) {
        if (lineText.includes(e.name) && !lineText.includes(`_${e.name}`)) {
          lines[e.line] = lineText.replace(new RegExp(`\\b${e.name}\\b`), `_${e.name}`);
        }
        continue;
      }

      if (/^\s*(const|let|var)\s+/.test(lineText)) {
        if (/^\s*(const|let|var)\s*\{/.test(lineText)) {
          if (lineText.includes(e.name)) {
            const nl = removeObjElement(lineText, e.name);
            if (nl !== null) lines[e.line] = nl;
          }
          continue;
        }
        if (/^\s*(const|let|var)\s*\[/.test(lineText)) {
          if (lineText.includes(e.name) && !lineText.includes(`_${e.name}`)) {
            lines[e.line] = lineText.replace(new RegExp(`\\b${e.name}\\b`), `_${e.name}`);
          }
          continue;
        }
        let st = e.line;
        while (st > 0 && !/^\s*(const|let|var)\s/.test(lines[st])) st--;
        let en = st;
        let depth = 0;
        let inStr = null;
        let endIdx = -1;
        outer: for (let i = st; i < lines.length && i - st <= 40; i++) {
          const l = lines[i];
          for (let j = 0; j < l.length; j++) {
            const ch = l[j];
            if (inStr) {
              if (ch === '\\') j++;
              else if (ch === inStr) inStr = null;
              continue;
            }
            if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
            if (ch === '{' || ch === '(' || ch === '[') depth++;
            else if (ch === '}' || ch === ')' || ch === ']') depth--;
            if (ch === ';' && depth <= 0) { endIdx = j; en = i; break outer; }
            if (ch === '}' && depth <= 0) { endIdx = j; en = i; break outer; }
          }
        }
        if (en < st || endIdx < 0) {
          if (lineText.includes(e.name) && !lineText.includes(`_${e.name}`)) {
            lines[e.line] = lineText.replace(new RegExp(`\\b${e.name}\\b`), `_${e.name}`);
          }
          continue;
        }
        const stmtText = lines.slice(st, en + 1).join('\n');
        const eq = stmtText.indexOf('=');
        const hasCall = eq >= 0 && /\(/.test(stmtText.slice(eq + 1));
        if (!hasCall) {
          lines.splice(st, en - st + 1);
        } else {
          if (lineText.includes(e.name) && !lineText.includes(`_${e.name}`)) {
            lines[e.line] = lineText.replace(new RegExp(`\\b${e.name}\\b`), `_${e.name}`);
          }
        }
        continue;
      }

      // usage-site error (e.g. `x++` reported for a dead let): find declaration, kill both
      if (lineText.includes(e.name)) {
        for (let i = e.line; i >= Math.max(0, e.line - 10); i--) {
          const s = lines[i].trim();
          const m2 = s.match(/^(const|let|var)\s+([A-Za-z_$][\w$]*)/);
          if (m2 && m2[2] === e.name) {
            // remove declaration statement (scan forward to `;` at depth 0)
            let en = i;
            let depth = 0;
            let inStr = null;
            outer2: for (let j = i; j < lines.length; j++) {
              for (let k = 0; k < lines[j].length; k++) {
                const ch = lines[j][k];
                if (inStr) {
                  if (ch === '\\') k++;
                  else if (ch === inStr) inStr = null;
                  continue;
                }
                if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
                if (ch === '{' || ch === '(' || ch === '[') depth++;
                else if (ch === '}' || ch === ')' || ch === ']') depth--;
                if (ch === ';' && depth <= 0) { en = j; break outer2; }
              }
              en = j;
              if (j - i > 20) break outer2;
            }
            lines.splice(i, en - i + 1);
            // remove standalone usage lines for this name anywhere in the file
            for (let j = lines.length - 1; j >= 0; j--) {
              const t = lines[j].trim();
              if (new RegExp(`^${e.name}(\\+\\+|--)\\s*;?\\s*$`).test(t)) lines.splice(j, 1);
            }
            break;
          }
          if (s && !/^[A-Za-z_$][\w$]*(\+\+|--)\s*;?\s*$/.test(s) && !/^\s*$/.test(s) && !/^[}\]],]/.test(s)) {
            break; // non-usage line above — give up
          }
        }
        continue;
      }

      // fallback rename
      if (lineText.includes(e.name) && !lineText.includes(`_${e.name}`)) {
        lines[e.line] = lineText.replace(new RegExp(`\\b${e.name}\\b`), `_${e.name}`);
      }
    }
    const out = lines.join('\n');
    if (out !== orig) fs.writeFileSync(f, out);
  }
}
console.log('done');
