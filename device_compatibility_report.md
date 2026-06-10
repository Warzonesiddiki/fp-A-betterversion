# Frontend Device Compatibility & Responsive Design Audit
## Project: FinPlan Pro (Enterprise FP&A Platform)
**Author:** Frontend Device Compatibility & Responsive Design Tester  
**Date:** June 8, 2026  
**Status:** Complete  

---

## 1. Executive Summary
FinPlan Pro is designed as an offline-first desktop application using Tauri. However, Tauri's architecture relies on system-native webviews (WebView2 on Windows, WebKit on macOS, WebKitGTK on Linux), and the application contains routes compile-ready for mobile devices (iOS/Android). This audit evaluates the codebase for visual stability, touch usability, print layout compliance, cross-browser compatibility, zoom accessibility (WCAG 2.1 AA), and viewport responsiveness.

### Key Finding Summary
- **Touch Targets:** Critical WCAG violation. Almost all navigation controls (Sidebar, Navbar), tables action items, and tabs are smaller than the 44x44px touch target minimum.
- **Global CSS Leak in SplitPane:** A severe CSS scoping leak inside `SplitPane.tsx` applies styling to *every* element with the `.h-full` class. This breaks layouts application-wide in Safari, Firefox, and Chrome.
- **Tauri/Safari WebKit Print Bug:** Direct browser/webview printing is broken on statements (e.g., P&L) because height constraints on flex parents (`h-screen`) are not reset inside `@media print`, cutting off print output after a single page.
- **WebKit Date Parsing Quirk:** Silent parsing failures occur in Safari/WebKit when parsing dates with custom or dashed formats.
- **Flex Container Resize Collapse:** Charts and auto-measuring containers lack safety constraints (`min-w-0`), leading to horizontal scrollbar overflows on resize.

---

## 2. Breakpoints & Grid Scaling Analysis
### Current Implementation
The application defines standard layout wrappers using Tailwind responsive classes (`sm:`, `md:`, `lg:`). The sidebar toggles between overlay mode and relative side positioning at the `md` (768px) breakpoint.

### Discovered Vulnerabilities
1. **Dashboard Header Clipping:**
   In `src/pages/DashboardPage.tsx`, the top bar is structured as:
   ```tsx
   <div className="flex items-center justify-between dashboard-header">
     <div>
       <div className="flex items-center gap-4 mb-2">
         <h1 className="text-2xl font-bold">Executive Dashboard</h1>
         ...
       </div>
     </div>
     <Button variant="secondary" size="sm" onClick={() => navigate('/data/gl-upload')}>
       <Upload className="h-3.5 w-3.5 mr-1.5" />
       Import
     </Button>
   </div>
   ```
   On screens smaller than 640px, the header does not wrap. The title, help button, tour button, and "Import" button are forced to stay on the same line, resulting in layout crowding and overflow on mobile viewports.
2. **Financial Report Headers:**
   Similar horizontal flex containers without column wrapping exist on reporting pages (e.g., `ProfitLossPage.tsx` and `ThreeStatementDashboardPage.tsx`). When the user opens the month selector beside the PDF/Excel buttons, the flex items clash on narrow screens.

### Remediation
Apply `flex-col sm:flex-row items-start sm:items-center` to header containers to stack items vertically on mobile viewports and lay them out horizontally on tablet/desktop.

---

## 3. Touch Target Size Audit (WCAG 2.1 AA 2.5.5)
A minimum target size of **44x44px** is required for all interactive elements to prevent mis-taps on touch devices (Tauri mobile and touch laptops).

### Discovered Vulnerabilities

| File & Location | Element | Current Tailwind Classes | Estimated Size | Status |
| :--- | :--- | :--- | :--- | :--- |
| `src/components/ui/Button.tsx` | Standard Button | `h-10 py-2 px-4` | 40px height | **Non-Compliant** |
| `src/components/ui/Button.tsx` | Small Button | `h-9 px-3` | 36px height | **Non-Compliant** |
| `src/components/ui/Button.tsx` | Icon Button | `h-10 w-10` | 40x40px | **Non-Compliant** |
| `src/components/layout/Navbar.tsx` | Mobile Menu Toggler | `p-2` + `Menu` (20px icon) | 36x36px | **Non-Compliant** |
| `src/components/layout/Navbar.tsx` | Search, Add, Bell Icons | `p-2` + `w-4 h-4` icon | 32x32px | **Non-Compliant** |
| `src/components/layout/Navbar.tsx` | Entity Switcher | `py-1.5` + `text-xs` | 28px height | **Non-Compliant** |
| `src/components/layout/Sidebar.tsx` | Mobile Close Button (`X`) | `p-1` + `w-4 h-4` icon | 24x24px | **Critically Small** |
| `src/components/layout/Sidebar.tsx` | Navigation Links | `px-3 py-2 text-xs` | 32px height | **Non-Compliant** |
| `src/pages/budgets/BudgetListPage.tsx` | Status Filter Buttons | `px-2.5 py-1.5 text-xs` | 28px height | **Non-Compliant** |
| `src/pages/budgets/BudgetListPage.tsx` | Row Action Buttons (Eye/Copy/Trash) | `p-1.5` + `w-3.5 h-3.5` icon | 26x26px | **Critically Small** |

### Visual Impact & User Experience
On a mobile device or high-DPI touch screen, the row action buttons (26x26px) are extremely close together. Clicking "Duplicate" instead of "View details" or "Delete" is highly likely due to the lack of padding and spacing.

### Remediation
1. Update `Button.tsx` variants to enforce 44px height for default, and increase click targets for smaller visual buttons using transparent borders or visual spacing:
   ```tsx
   const sizeClasses = {
     default: 'h-11 py-3 px-4', // Met 44px target
     sm: 'h-9 px-3 rounded-md after:absolute after:inset-y-0 after:h-11 after:w-full', // Visual small, touch-expanded
     lg: 'h-12 px-8 rounded-md',
     icon: 'h-11 w-11', // Met 44x44px
   };
   ```
2. Wrap row action buttons in a flex-container with larger visual padding or use Tailwind's `touch-target` expanders.

---

## 4. Print Layout Compatibility & Multi-page Bug
### Current Implementation
The application includes `src/styles/print.css` loaded globally. It attempts to hide navigations, sidebar, and toolbars via `.no-print`, and resets backgrounds to white.

### Discovered Vulnerabilities
1. **The Multi-page Cutoff Bug (Critical):**
   In `src/components/layout/AppLayout.tsx`, the layout is wrapped in a flex container restricting height:
   ```tsx
   <div className="flex h-screen responsive-root">
     ...
     <div className="flex-1 flex flex-col overflow-hidden min-w-0">
       <Navbar />
       <main id="main-content" className="flex-1 overflow-y-auto p-6">
         <Outlet />
       </main>
     </div>
   </div>
   ```
   During browser printing, any ancestor layout defined with `h-screen` (height: 100vh), `flex-1`, or `overflow-hidden` constraints will restrict the viewport to the current screen size. The browser's print engine is unable to generate page breaks and cuts off the report at the end of the first page.
2. **Chart Visibility:**
   Recharts charts elements render as dynamic SVGs. In WebKit (macOS Tauri) and Gecko (Firefox), SVGs placed inside hidden/scrollable flex items often render blank or with zero width when printed.

### Remediation
Force page-height resets inside `src/styles/print.css` to allow the document height to expand naturally during printing:
```css
@media print {
  html, body, #root, .responsive-root, .flex-1, main {
    height: auto !important;
    min-height: auto !important;
    max-height: none !important;
    overflow: visible !important;
    position: relative !important;
    display: block !important;
  }
  
  /* Prevent chart layout truncation */
  .recharts-responsive-container {
    width: 100% !important;
    height: auto !important;
    min-height: 300px !important;
  }
}
```

---

## 5. Safari & Firefox-Specific Engine Bugs
### Discovered Vulnerabilities
1. **SplitPane CSS Global Scope Leak (Critical):**
   In `src/components/ui/SplitPane.tsx` (Lines 63-70), the styling block is injected as an inline string inside the React element tree:
   ```tsx
   <style>{`
     @media (min-width: 768px) {
       .h-full { --split-width: ${split}%; }
     }
     @media (max-width: 767px) {
       .h-full { width: 100%; height: 50%; }
     }
   `}</style>
   ```
   **The Bug:** The class selector `.h-full` targets any element using that class name. In Tailwind, `.h-full` is the standard class for setting `height: 100%`. In Safari, Chrome, and Firefox, injecting this globally causes all `.h-full` elements to shrink to `split%` width (or 50% height on mobile).
   This completely breaks the page layouts whenever a `SplitPane` is active.

2. **SplitPane Touch Pointer Support:**
   `SplitPane.tsx` only registers mouse event handlers (`onMouseDown`, `mousemove`, `mouseup`):
   ```tsx
   const handleMouseDown = useCallback((e: React.MouseEvent) => {
     e.preventDefault();
     setIsDragging(true);
   }, []);
   ```
   **The Bug:** Touch events are not intercepted. On mobile Safari (iOS WebView) or touch laptops, users cannot drag the split pane divider.

3. **Silent Date Parsing Quirks in Safari WebKit:**
   In `src/store/glStore.ts` (Line 19) and `src/utils/validation.ts` (Line 32):
   ```tsx
   const d = new Date(dateStr);
   ```
   **The Bug:** If CSV inputs have dates formatted as `YYYY/MM/DD` or dashed variants `DD-MM-YYYY`, Google Chrome and Firefox parse them correctly. WebKit (Safari engine used by Tauri on macOS) rejects these formats and returns `Invalid Date` (leading to `NaN` values and broken calculations).

4. **Flex Item Auto-Shrink Bug (Gecko/WebKit):**
   Recharts charts (`ResponsiveContainer`) are nested in flex containers throughout pages without specifying `min-w-0` on their parents.
   **The Bug:** Firefox and Safari default flex items to `min-width: auto`. An auto-measuring SVG will prevent the flex child from shrinking, resulting in horizontal scrolling/layout breaking on window resize.

### Remediation
1. **Scoping style inside SplitPane:**
   Use a unique class selector to scope the width variable:
   ```tsx
   <div className={cn("flex flex-col md:flex-row w-full h-full overflow-hidden split-pane-container")}>
     <div className="split-pane-left h-full overflow-auto" style={{ width: `var(--split-width, ${split}%)` }}>
       <style>{`
         @media (min-width: 768px) {
           .split-pane-container > .split-pane-left { --split-width: ${split}%; }
         }
         @media (max-width: 767px) {
           .split-pane-container > .split-pane-left { width: 100%; height: 50%; }
         }
       `}</style>
       {left}
     </div>
     ...
   ```
2. **Add Touch Listeners:**
   Bind `onTouchStart` in addition to `onMouseDown` on the divider slider.
3. **Parse Dates Robustly:**
   Avoid raw `new Date(string)` constructors. Use an ISO-compliant parser utility:
   ```typescript
   export function safeParseDate(value: string): Date {
     // Replaces slashes with dashes and handles formats
     const cleaned = value.replace(/\//g, '-').trim();
     return new Date(cleaned);
   }
   ```

---

## 6. Zoom Adaptability (200% Zoom)
### Discovered Vulnerabilities
1. **Non-relative Typography and Padding Units:**
   In `src/index.css`, fonts and spacing values use absolute pixel constraints:
   ```css
   body { font-size: 13px; }
   h1 { font-size: 24px; }
   --space-md: 12px;
   ```
   **The Bug:** Zooming using browser/system text accessibility features scales relative units (`rem`/`em`) but does not adjust absolute pixel boundaries properly. This violates WCAG 2.1 Success Criterion 1.4.4.
2. **Hardcoded Height Overlap:**
   Multiple cards and chart containers (e.g., `height={400}` inside `ChartWrapper`) are hardcoded in pixels. When zoomed to 200%, the increased text size inside dashboard widgets overflows and clips because container heights are locked.

### Remediation
Convert typography size scales to `rem` relative units (e.g., `font-size: 0.8125rem` for 13px, `font-size: 1.5rem` for 24px) in `index.css`.

---

## 7. Scroll Container Safety
### Discovered Vulnerabilities
1. **AG Grid & standard tables (`BudgetListPage.tsx`):**
   - Tables use `overflow-x-auto` properly to allow horizontal scrolling on layout overflow.
   - However, standard HTML table cells use `whitespace-nowrap`, but headers do not enforce wrapping controls consistently. Under 200% zoom, headers wrap while rows do not, leading to misaligned columns and hard-to-read grids.
2. **Layout Overflows:**
   - On the `DashboardPage`, nested Recharts SVGs expand and push layout cards out of the visible screen boundaries. A lack of `min-w-0` on container wrappers forces horizontal scrolling of the entire dashboard view.

### Remediation
Apply `min-w-0` to all grid cells and flex children housing charts, and wrap table headers and rows in identical layout rules:
```tsx
<th className="px-4 py-3 whitespace-nowrap text-left">...</th>
```

---

## 8. Prioritized Action Plan & Fixes

### Phase 1: Critical Style & Layout Fixes (High Priority)
1. **SplitPane Scope Leak:** Rename style target selector in `SplitPane.tsx` to prevent application-wide `.h-full` overrides.
2. **Safari WebKit Date Parser:** Implement `safeParseDate` in `src/utils/validation.ts` and `src/store/glStore.ts`.
3. **Flex Parent Chart Sizing:** Add `min-w-0` class to card contents containing `ResponsiveContainer` items.

### Phase 2: Touch targets & WCAG 2.1 Compliance (Medium Priority)
1. Enforce minimum button touch sizing (44x44px) inside `Button.tsx`.
2. Expand click areas of smaller icon buttons in the Sidebar and Navbar using invisible target paddings.

### Phase 3: Print & Zoom Scaling (Low Priority)
1. Inject the viewport height override stylesheet rules inside `@media print` in `print.css`.
2. Migrate typography scaling from `px` to `rem` inside `index.css`.
