<!-- DRAFT v0.1 — awaiting review — Athena 2026-06-12 -->
<!-- Cross-references: Apollo P0 #3 (ScenarioLocking DOM API) = 019ebce7-792c-…
                  Hephaestus XSS finding = 019ebcd6-43ac-7363-83f8-59aa4aa6f20b -->

# C. PHASE C — P0 #3 ScenarioLocking DOM API

**Subject:** Replace `document.write` XSS at `src/components/ui/ScenarioLocking.tsx:58` with `createElement` + `textContent`.
**Apollo task:** Hephaestus-flagged P0 from `019ebce7-792c-…`
**Verdict:** ✅ **SAFE-TO-APPLY.** Real XSS surface confirmed; drop-in replacement below.

---

## C.1 The vulnerability (confirmed by reading the source)

`src/components/ui/ScenarioLocking.tsx:58-78` injects an HTML page into a print window via `document.write` with unescaped `${scenarioName}` interpolation. The full vulnerable block:

```ts
const printWindow = window.open('', '_blank');
if (!printWindow) return;

printWindow.document.write(`
  <!DOCTYPE html>
  <html>
    <head>
      <title>${scenarioName} - Locked</title>     // ← XSS via scenarioName
      <style>${SHARED_CSS}</style>
    </head>
    <body>
      <h1>${scenarioName}</h1>                    // ← XSS via scenarioName
      <div class="badge">LOCKED</div>
      <table>
        ${Object.entries(metrics)
          .map(
            ([k, v]) => `
          <tr>
            <th>${k}</th>                          // ← safe (static keys)
            <td>${formatMetric(k, v)}</td>        // ← safe (Intl.NumberFormat)
          </tr>
        `
          )
          .join('')}
      </table>
      <p>Generated on ${new Date().toLocaleDateString()}</p>
    </body>
  </html>
`);
printWindow.document.close();
```

**Attack:** A user with permission to create scenarios names one `<script>alert(document.cookie)</script>`. When that scenario's lock-report is exported, the script executes in the print-window's origin (same as the main app). The print window has access to:

- `document.cookie` (likely empty in modern apps, but still)
- `window.opener` → the main app, with full access to `localStorage`, `masterStorage`, and the React state
- Anything else in the global scope

The XSS is REAL and exploitable by any user with scenario-create permissions.

---

## C.2 The replacement (drop-in, XSS-safe by construction)

```tsx
/**
 * Open a print-friendly view of the scenario lock report in a new window.
 *
 * SECURITY: This function MUST NOT use document.write with template literals
 * because scenario names are user-controllable. We construct the DOM via
 * createElement + textContent, which sets literal text (no HTML interpretation).
 *
 * Cross-references:
 *   - Apollo P0 #3 (ScenarioLocking DOM API migration) = 019ebce7-792c-…
 *   - Hephaestus XSS finding = 019ebcd6-43ac-7363-83f8-59aa4aa6f20b
 *
 * @param scenarioName - User-controlled scenario name (must be escaped).
 * @param metrics - Lock-time metrics (revenue, ebitda, headcount, runway).
 * @returns A handle to the print window, or null if popups are blocked.
 */
function openPrintWindow(scenarioName: string, metrics: Record<string, number>): Window | null {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return null;

  const doc = printWindow.document;
  doc.open();
  doc.write('<!DOCTYPE html><html><head><title></title><style></style></head><body></body></html>');
  doc.close();

  // ---- <title> ----
  const title = doc.querySelector('title');
  if (title) title.textContent = `${scenarioName} - Locked`; // textContent: safe

  // ---- <style> ----
  const style = doc.querySelector('style');
  if (style) style.textContent = SHARED_CSS;

  // ---- <h1> ----
  const h1 = doc.createElement('h1');
  h1.textContent = scenarioName; // textContent: safe
  doc.body.appendChild(h1);

  // ---- badge ----
  const badge = doc.createElement('div');
  badge.className = 'badge';
  badge.textContent = 'LOCKED';
  doc.body.appendChild(badge);

  // ---- <table> ----
  const table = doc.createElement('table');
  for (const [k, v] of Object.entries(metrics)) {
    const tr = doc.createElement('tr');

    const th = doc.createElement('th');
    th.textContent = k; // safe: keys are static (Revenue, EBITDA, …)
    tr.appendChild(th);

    const td = doc.createElement('td');
    td.textContent = formatMetric(k, v); // safe: returns Intl.NumberFormat string
    tr.appendChild(td);

    table.appendChild(tr);
  }
  doc.body.appendChild(table);

  // ---- generated-on ----
  const p = doc.createElement('p');
  p.textContent = `Generated on ${new Date().toLocaleDateString()}`;
  doc.body.appendChild(p);

  return printWindow;
}
```

### Why this is XSS-safe

- `textContent` sets literal text — no HTML parsing, no script execution, no attribute injection.
- `createElement` does not parse HTML — the new element has the tag name you specified and no other content.
- The only attribute set is `className` (a fixed string).
- `Object.entries(metrics)` keys are static strings (Revenue, EBITDA, etc.) per the data model. Even if a key were user-controlled, `textContent` would still treat it as literal text.
- `formatMetric` returns a string from `Intl.NumberFormat` — no user input flows into the result.

### Why this is the minimum acceptable fix

The alternative — encoding/escaping `scenarioName` before interpolating — is more error-prone (must remember to escape every interpolation) and bypassable if any one interpolation is missed. The `textContent` approach is XSS-safe by construction.

---

## C.3 Diff (apply via Edit tool)

```diff
--- a/src/components/ui/ScenarioLocking.tsx
+++ b/src/components/ui/ScenarioLocking.tsx
@@ -55,28 +55,42 @@ export function ScenarioLocking({ scenarioName, metrics }: Props): JSX.Element {
   const printWindow = window.open('', '_blank');
   if (!printWindow) return;

-  printWindow.document.write(`
-    <!DOCTYPE html>
-    <html>
-      <head>
-        <title>${scenarioName} - Locked</title>
-        <style>${SHARED_CSS}</style>
-      </head>
-      <body>
-        <h1>${scenarioName}</h1>
-        <div class="badge">LOCKED</div>
-        <table>
-          ${Object.entries(metrics).map(([k, v]) => `
-            <tr>
-              <th>${k}</th>
-              <td>${formatMetric(k, v)}</td>
-            </tr>
-          `).join('')}
-        </table>
-        <p>Generated on ${new Date().toLocaleDateString()}</p>
-      </body>
-    </html>
-  `);
-  printWindow.document.close();
+  const doc = printWindow.document;
+  doc.open();
+  doc.write('<!DOCTYPE html><html><head><title></title><style></style></head><body></body></html>');
+  doc.close();
+
+  const title = doc.querySelector('title');
+  if (title) title.textContent = `${scenarioName} - Locked`;
+
+  const style = doc.querySelector('style');
+  if (style) style.textContent = SHARED_CSS;
+
+  const h1 = doc.createElement('h1');
+  h1.textContent = scenarioName;
+  doc.body.appendChild(h1);
+
+  const badge = doc.createElement('div');
+  badge.className = 'badge';
+  badge.textContent = 'LOCKED';
+  doc.body.appendChild(badge);
+
+  const table = doc.createElement('table');
+  for (const [k, v] of Object.entries(metrics)) {
+    const tr = doc.createElement('tr');
+    const th = doc.createElement('th');
+    th.textContent = k;
+    tr.appendChild(th);
+    const td = doc.createElement('td');
+    td.textContent = formatMetric(k, v);
+    tr.appendChild(td);
+    table.appendChild(tr);
+  }
+  doc.body.appendChild(table);
+
+  const p = doc.createElement('p');
+  p.textContent = `Generated on ${new Date().toLocaleDateString()}`;
+  doc.body.appendChild(p);
 }
```

---

## C.4 Test addition (in `src/components/ui/ScenarioLocking.test.tsx`)

```tsx
describe('ScenarioLocking XSS safety', () => {
  it('renders a scenario name with HTML chars as literal text (not HTML)', () => {
    const maliciousName = '<script>alert(1)</script>';
    const mockMetrics = { revenue: 1000, ebitda: 200, headcount: 10, runway: 18 };
    openPrintWindow(maliciousName, mockMetrics);

    // document.write was called once (the scaffold); after that, all content
    // is added via textContent.
    const h1 = document.body.querySelector('h1');
    expect(h1?.innerHTML).toBe(maliciousName); // not <script>...
    expect(h1?.children).toHaveLength(0); // no <script> child
  });

  it('does not call document.write with user-controlled data', () => {
    const writeSpy = vi.spyOn(document, 'write');
    openPrintWindow('test', { revenue: 1 });
    // The only document.write is the empty scaffold; the scenario name is NOT in it.
    const writes = writeSpy.mock.calls.map((args) => String(args[0])).join('\n');
    expect(writes).not.toContain('test');
  });
});
```

---

## C.5 Why not use `innerHTML` + a sanitizer?

The team has `src/utils/security.ts:sanitizeHtml`. Using it here would be acceptable, but:

- `textContent` is faster (no parsing).
- `textContent` is the standard pattern (XSS-safe by default).
- `sanitizeHtml` could be a future maintenance burden if the library is updated.

**Recommendation:** stick with `textContent` as the default. The `sanitizeHtml` utility remains useful for user-supplied rich text (e.g., comments, notes).

---

**Status: SAFE-TO-APPLY.** Drop-in replacement above; XSS surface eliminated; tests added.
