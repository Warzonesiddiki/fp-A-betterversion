// Generate massive task board — 250+ tasks covering ALL perfection dimensions
const fs = require('fs');

const tasks = [];
let id = 0;
const add = (cat, title, role, priority, spec, deps=[]) => {
  tasks.push({
    id: 'T' + String(++id).padStart(4,'0'),
    cat, title, role, priority, spec, deps,
    status: 'unclaimed', claimedBy: '',
    createdAt: new Date().toISOString()
  });
};

// ============ A. TYPESCRIPT / LINT / TEST GATES (25) ============
add('gates','TSC 0 errors all src','brutus',99,'node node_modules/typescript/bin/tsc --noEmit');
add('gates','ESLint 0 errors all src','amelia',98,'node node_modules/eslint/bin/eslint.js src --max-warnings 0');
add('gates','ESLint 0 warnings all src','amelia',85,'Bring 450 → 0: jsx-a11y/label 243, no-explicit-any 62, exhaustive-deps 38');
add('gates','Vitest 0 failures','brutus',99,'node --max-old-space-size=81920 node_modules/vitest/vitest.mjs run');
add('gates','Vite build green','atlas',98,'node node_modules/vite/bin/vite.js build');
add('gates','Coverage 80% statements','cobalt',90,'vitest run --coverage; per-file threshold');
add('gates','Coverage 70% branches','cobalt',88);
add('gates','Coverage 80% functions','cobalt',85);
add('gates','Coverage 80% lines','cobalt',85);
add('gates','Bundle main < 150KB gzip','atlas',95,'Measure dist/assets/index-*.js gzip');
add('gates','Bundle total < 2MB gzip','atlas',93);
add('gates','Bundle check script green','john',80,'node scripts/bundle-check.js');
add('gates','Coverage check script green','john',80,'node scripts/check-coverage.js');
add('gates','Prettier --check pass','amelia',50);
add('gates','No `any` type anywhere','amelia',85,'replace with unknown + narrowing');
add('gates','No `console.log` in src','censor',70,'keep console.error/warn only');
add('gates','No inline styles anywhere','amelia',75,'grep style={ in src/**/*.tsx');
add('gates','No default exports','amelia',70,'named exports only');
add('gates','No `as any` casts','amelia',80);
add('gates','No `// @ts-ignore`','amelia',75);
add('gates','No `var` keyword','amelia',40);
add('gates','No `eval` / `new Function`','censor',90);
add('gates','No `dangerouslySetInnerHTML`','censor',85);
add('gates','No `localStorage` raw calls','censor',95,'CWE-922, use masterStorage');
add('gates','No hardcoded API keys/secrets','censor',95,'grep for sk_, AKIA, Bearer');

// ============ B. SECURITY (25) ============
add('sec','Plugin sandbox 3-layer test','sentinel',85,'Verify escape impossible');
add('sec','No eval/Function/import() in plugins','sentinel',90);
add('sec','Zod schema at all plugin APIs','sentinel',80);
add('sec','Ed25519 manifest verify','sentinel',70);
add('sec','AES-256-GCM storage','sentinel',70);
add('sec','PBKDF2 >= 600k iterations','sentinel',60);
add('sec','encryptStorage adoption in stores','censor',75);
add('sec','No plain localStorage (CWE-922)','censor',95);
add('sec','No console.log of secrets','censor',50);
add('sec','Threat model per phase','sentinel',50);
add('sec','CSP headers','sentinel',60,'index.html meta');
add('sec','Tauri pubkey in secrets','john',50);
add('sec','Dep audit zero high/critical','john',70);
add('sec','License whitelist','john',40);
add('sec','SBOM generated','john',30);
add('sec','Input validation all user input','sentinel',75);
add('sec','Output encoding all render','sentinel',65);
add('sec','XSS prevention verified','sentinel',70);
add('sec','CSRF token mutations','sentinel',50);
add('sec','Rate limit API calls','sentinel',40);
add('sec','Session timeout config','sentinel',30);
add('sec','Auth guard all routes','sentinel',60);
add('sec','RBAC verified per role','sentinel',55);
add('sec','Audit log immutable','sentinel',65);
add('sec','Secure random everywhere','sentinel',45,'crypto.getRandomValues only');

// ============ C. ENGINES (60) ============
const engines = [
  'NPV','IRR','XIRR','PMT','PV','FV','SLN','DDB','SYD','PRICE','YTM',
  'BSM','VaR','CVaR','WACC','CAPM','Beta',
  'DCF-FCFF','DCF-FCFE','DCF-APV','Consolidation','Goodwill','GoodwillImpairment',
  'Lease-IFRS16','ROU','LeaseLiability','Revenue-IFRS15','5StepModel','SSP',
  'Tax-Deferred','DTA','DTL','Inventory-NRV','LCM','Provisions','IAS37',
  'Currency-Translation','CTA','FunctionalCurrency','Government-Grants',
  'Share-Based-Payment','BlackScholes-Vest','EPS','BasicEPS','DilutedEPS',
  'Segment','CashFlow-Indirect','CashFlow-Direct','Reconciliation',
  'MonteCarlo-PMC','MonteCarlo-CFM','Distributions-Normal','Distributions-Lognormal',
  'Distributions-T','Distributions-Chi2','Distributions-F','GoalSeek',
  'Budget-Variance','WorkingCapital','ESG-Metrics','FX-Forward','Swap-IRS'
];
engines.forEach((e, i) => {
  add('eng',`Engine ${e} known-answer test`, 'cobalt', 65,
    `Write ${e} test with IAS/FASB/Excel exact value; toBeCloseTo 4 decimals`);
});

// ============ D. A11Y (20) ============
add('a11y','WCAG 2.2 AA all flows','sally',85);
add('a11y','Keyboard nav 100% pages','sally',75);
add('a11y','Focus rings visible everywhere','sally',65);
add('a11y','Contrast >= 4.5:1 all text','sally',90);
add('a11y','Alt text all charts/tables','sally',60);
add('a11y','ARIA roles/labels correct','sally',55);
add('a11y','Skip-to-content link','sally',35);
add('a11y','prefers-reduced-motion','sally',45);
add('a11y','prefers-color-scheme dark+light','sally',55);
add('a11y','Screen reader NVDA test','sally',35);
add('a11y','200% zoom no overflow','sally',45);
add('a11y','Color-blind safe palette','sally',45);
add('a11y','Chart data-table fallback','sally',55);
add('a11y','Form labels associated','sally',70,'243 lint warnings');
add('a11y','Error messages announced','sally',50);
add('a11y','Modal focus trap','sally',50);
add('a11y','Tab order logical','sally',50);
add('a11y','Live regions polite/assertive','sally',40);
add('a11y','Touch target >= 44x44','sally',50);
add('a11y','Heading hierarchy h1-h6','sally',45);

// ============ E. STORAGE (15) ============
add('store','SQLite INTEGER cents only','amelia',70);
add('store','transaction_id UNIQUE constraint','amelia',60);
add('store','period_lock trigger','amelia',60);
add('store','50+ stores audited','censor',70);
add('store','Migration paths tested','amelia',50);
add('store','OPFS atomic + debounce 250ms','atlas',50);
add('store','Chunked > 10MB blobs','atlas',40);
add('store','CRDT sync conflict-free','amelia',50);
add('store','Audit ZIP SHA-256','paige',50);
add('store','Backup/restore flows','amelia',45);
add('store','Data export all formats','paige',40);
add('store','Data import CSV/XLSX/QBO','paige',45);
add('store','Schema versioning','amelia',55);
add('store','Soft-delete with restore','amelia',40);
add('store','Tombstone cleanup cron','amelia',35);

// ============ F. INFRA (15) ============
add('infra','CI 4 jobs green','john',60);
add('infra','Coverage gate CI','john',55);
add('infra','Bundle gate CI','john',55);
add('infra','Cache node_modules CI','john',45);
add('infra','Workbox precache shell','john',45);
add('infra','Workbox runtime cache','john',35);
add('infra','Tauri auto-update signed','john',50);
add('infra','Tauri pubkey secrets','john',40);
add('infra','Error boundary app-wide','paige',40);
add('infra','Logger structured','paige',45);
add('infra','Telemetry opt-in','paige',30);
add('infra','Crash report local-only','paige',35);
add('infra','Performance marks','atlas',45);
add('infra','Memory profiler hooks','atlas',35);
add('infra','Health check endpoint','john',30);

// ============ G. WORKERS (15) ============
add('workers','Monte Carlo pool 4-8','atlas',60);
add('workers','Formula eval worker','atlas',45);
add('workers','Batch-calc worker','atlas',45);
add('workers','Export worker','atlas',45);
add('workers','Scenario worker','atlas',45);
add('workers','Consolidation worker','atlas',50);
add('workers','FinanceCore worker','atlas',45);
add('workers','WorkerPool backpressure','atlas',55);
add('workers','Worker timeout + cancel','atlas',50);
add('workers','Worker error propagation','atlas',50);
add('workers','WASM Monte Carlo compile','atlas',40);
add('workers','WASM distributions','atlas',35);
add('workers','WASM formula eval','atlas',35);
add('workers','Worker unit tests','cobalt',60);
add('workers','Worker pool stress test','cobalt',50);

// ============ H. BUILD/BUNDLE (15) ============
add('build','Manual chunks verify','atlas',70);
add('build','Lazy-load routes > 100KB','atlas',65);
add('build','Tree-shake recharts','atlas',55);
add('build','Tree-shake ag-grid','atlas',55);
add('build','Tree-shake i18n','atlas',45);
add('build','Tree-shake date-fns','atlas',50);
add('build','CSS purge unused','atlas',50);
add('build','SVG sprite/inline','atlas',35);
add('build','Font subset','atlas',35);
add('build','Image lazy + srcset','atlas',40);
add('build','Code split vendor','atlas',60);
add('build','Preload critical','atlas',50);
add('build','Bundle report stats.html','atlas',35);
add('build','Bundle budget in CI','john',50);
add('build','Source maps prod','atlas',40);

// ============ I. PLUGINS (15) ============
add('plugin','Plugin manifest v1 spec','winston',70);
add('plugin','Plugin marketplace browse','winston',60);
add('plugin','Plugin install flow','winston',60);
add('plugin','Plugin enable/disable','winston',55);
add('plugin','Plugin version compat','winston',55);
add('plugin','Plugin API surface','winston',65);
add('plugin','Plugin lifecycle hooks','winston',55);
add('plugin','Plugin storage isolated','sentinel',65);
add('plugin','Plugin network policy','sentinel',70);
add('plugin','Plugin permissions','sentinel',70);
add('plugin','Plugin signature verify','sentinel',75);
add('plugin','Plugin audit log','sentinel',60);
add('plugin','Plugin crash isolation','sentinel',65);
add('plugin','Plugin UI sandbox','sentinel',65);
add('plugin','Plugin marketplace signing','sentinel',75);

// ============ J. PAGES / ROUTES (20) ============
add('pages','Dashboard home polish','mary',60);
add('pages','Budget creation wizard','mary',55);
add('pages','Forecast scenario flow','mary',55);
add('pages','Consolidation workspace','mary',60);
add('pages','Variance analysis page','mary',55);
add('pages','Report builder','mary',60);
add('pages','Cash flow page','mary',50);
add('pages','Three statement view','mary',55);
add('pages','CapEx planning','mary',50);
add('pages','KPI dashboard','mary',50);
add('pages','Driver-based planning','mary',50);
add('pages','What-if analysis','mary',50);
add('pages','Audit trail page','mary',45);
add('pages','Settings + config','mary',45);
add('pages','Help + docs in-app','paige',40);
add('pages','Onboarding tour','mary',50);
add('pages','Mobile responsive','mary',55);
add('pages','Dark mode all pages','sally',60);
add('pages','Empty states all pages','mary',45);
add('pages','Error states all pages','mary',45);

// ============ K. COMPONENTS (20) ============
add('comp','AG Grid theme + a11y','mary',55);
add('comp','Recharts theme + a11y','mary',55);
add('comp','Form input variants','mary',40);
add('comp','Date picker locale','mary',40);
add('comp','Money input thousand sep','mary',45);
add('comp','Percent input decimal','mary',45);
add('comp','Multi-select dropdown','mary',40);
add('comp','Toast/notification','mary',45);
add('comp','Modal/dialog','mary',45);
add('comp','Tooltip consistent','mary',40);
add('comp','Loading skeleton','mary',40);
add('comp','Pagination','mary',40);
add('comp','Sortable headers','mary',40);
add('comp','Filter panel','mary',45);
add('comp','Command palette','mary',50);
add('comp','Context menu','mary',40);
add('comp','Drawer/sheet','mary',40);
add('comp','Tabs component','mary',35);
add('comp','Breadcrumb','mary',35);
add('comp','Stepper','mary',40);

// ============ L. CHARTS (15) ============
add('chart','Chart library wrapper','mary',55);
add('chart','Chart theme tokens','mary',50);
add('chart','Chart a11y data-table','sally',50);
add('chart','Chart export PNG/SVG','mary',45);
add('chart','Chart drill-down','mary',50);
add('chart','Chart cross-filter','mary',50);
add('chart','Chart real-time update','mary',50);
add('chart','Chart virtualization','atlas',55);
add('chart','Chart axis format','mary',45);
add('chart','Chart legend toggle','mary',40);
add('chart','Chart annotation','mary',45);
add('chart','Chart comparison','mary',45);
add('chart','Chart forecast band','mary',50);
add('chart','Chart sensitivity','mary',50);
add('chart','Chart distribution plot','mary',50);

// ============ M. DOCS (15) ============
add('docs','CONTRIBUTING.md polish','paige',50);
add('docs','CHANGELOG.md current','paige',50);
add('docs','MASTER_REPORT.md','vera',60);
add('docs','ARCHITECTURE.md','paige',35);
add('docs','SECURITY.md','sentinel',45);
add('docs','API reference generated','paige',40);
add('docs','Component storybook','paige',50);
add('docs','Engine catalog','paige',40);
add('docs','Onboarding guide','paige',35);
add('docs','TROUBLESHOOTING.md','paige',30);
add('docs','FAQ.md','paige',25);
add('docs','PERFORMANCE.md','atlas',40);
add('docs','ACCESSIBILITY.md','sally',40);
add('docs','TESTING.md','cobalt',40);
add('docs','RELEASE.md','john',35);

// ============ N. I18N (10) ============
add('i18n','Locale bundles en+1','paige',25);
add('i18n','No hardcoded strings','paige',35);
add('i18n','Date/number locale','paige',30);
add('i18n','Currency locale display','paige',40);
add('i18n','Pluralization rules','paige',30);
add('i18n','RTL support','paige',25);
add('i18n','Translation tool','paige',20);
add('i18n','Fallback locale','paige',25);
add('i18n','Pseudo-locale test','paige',20);
add('i18n','Locale switcher UI','paige',30);

// ============ O. TAURI (10) ============
add('tauri','Tauri build green','john',50);
add('tauri','Tauri dev mode','john',45);
add('tauri','Tauri auto-update','john',50);
add('tauri','Tauri signing key','john',55);
add('tauri','Tauri bundling','john',45);
add('tauri','Tauri CSP','sentinel',55);
add('tauri','Tauri IPC validate','sentinel',55);
add('tauri','Tauri capabilities','sentinel',50);
add('tauri','Tauri tray icon','john',35);
add('tauri','Tauri single instance','john',35);

// ============ P. PERFORMANCE (15) ============
add('perf','React.memo heavy renders','atlas',55);
add('perf','useMemo/useCallback audited','atlas',50);
add('perf','Virtualization long lists','atlas',55);
add('perf','Code split heavy routes','atlas',55);
add('perf','Preload critical data','atlas',50);
add('perf','Service worker cache','atlas',50);
add('perf','Image optimization','atlas',45);
add('perf','Font display swap','atlas',40);
add('perf','Critical CSS inline','atlas',45);
add('perf','JS defer non-critical','atlas',45);
add('perf','Lazy load below fold','atlas',45);
add('perf','Prefetch next routes','atlas',50);
add('perf','Worker offload heavy','atlas',55);
add('perf','WASM hot paths','atlas',45);
add('perf','Memory leak audit','atlas',55);

// ============ Q. TEST COVERAGE (20) ============
add('test','Component snapshot 100%','cobalt',50);
add('test','Component interaction 80%','cobalt',55);
add('test','Hook tests all hooks','cobalt',55);
add('test','Store tests all stores','cobalt',60);
add('test','Engine known-answers 100%','cobalt',70);
add('test','Edge cases empty/null','cobalt',60);
add('test','Error paths tested','cobalt',55);
add('test','Integration flows','cobalt',55);
add('test','E2E critical paths','cobalt',60);
add('test','Visual regression','cobalt',40);
add('test','A11y automated tests','sally',55);
add('test','Performance tests','atlas',40);
add('test','Store reset in beforeEach','cobalt',50);
add('test','Mock all network calls','cobalt',50);
add('test','No Math.random fixtures','cobalt',45);
add('test','No Date.now in tests','cobalt',45);
add('test','Test isolation verified','cobalt',50);
add('test','Flaky test detector','cobalt',45);
add('test','Test data factories','cobalt',50);
add('test','Coverage trending','cobalt',35);

// ============ R. UX / DESIGN (15) ============
add('ux','Empty states all flows','mary',45);
add('ux','Loading states all flows','mary',45);
add('ux','Error states all flows','mary',45);
add('ux','Success feedback','mary',40);
add('ux','Onboarding tour polish','mary',45);
add('ux','Help tooltips','mary',35);
add('ux','Keyboard shortcuts','mary',45);
add('ux','Command palette power','mary',50);
add('ux','Recent/favorite items','mary',40);
add('ux','Search global','mary',50);
add('ux','Filter persistence','mary',40);
add('ux','Drag and drop','mary',40);
add('ux','Inline edit','mary',40);
add('ux','Bulk actions','mary',40);
add('ux','Undo/redo','amelia',55);

// ============ S. REFACTOR (15) ============
add('refac','Engine dedup 181 dupes','atlas',75);
add('refac','Shared primitives','atlas',60);
add('refac','Type cleanup','amelia',55);
add('refac','Component decomposition','amelia',50);
add('refac','Hook extraction','amelia',50);
add('refac','Store split monolithic','amelia',55);
add('refac','Service layer clean','amelia',50);
add('refac','Util consolidation','amelia',50);
add('refac','Constants extracted','amelia',45);
add('refac','Magic numbers named','amelia',45);
add('refac','Long file split','amelia',50);
add('refac','Dead code removed','amelia',55);
add('refac','Unused exports','amelia',50);
add('refac','Import order','amelia',40);
add('refac','Circular dep audit','amelia',55);

// ============ T. INTEGRATION (10) ============
add('int','QuickBooks import','paige',45);
add('int','Xero import','paige',40);
add('int','Sage import','paige',35);
add('int','CSV import wizard','paige',50);
add('int','Excel import','paige',50);
add('int','PDF export','paige',50);
add('int','Excel export','paige',50);
add('int','Email share (link)','paige',35);
add('int','Webhook local','john',35);
add('int','Open Banking mock','paige',30);

// ============ U. CORRECTNESS FIXES (10) ============
add('fix','ConsolidationEngine minority interest filter','brutus',90,'IAS 28 ¶16-17, src/engines/ConsolidationEngine.ts');
add('fix','ConsolidationEngine CTA posting','brutus',90,'IAS 21 ¶32-37');
add('fix','Fix all 806 vitest failures','brutus',95);
add('fix','Resolve banking/CreditRiskEngine missing','atlas',85,'src/engines/index.ts broken re-export');
add('fix','Stale path accounting/__tests__','brutus',70);
add('fix','SafeMathParser 275 failures','brutus',80);
add('fix','ApprovalRoutingEngine 27 failures','brutus',75);
add('fix','ActivityFeed 16 failures','brutus',65);
add('fix','SOXComplianceEngine 14 failures','brutus',70);
add('fix','NotificationAdapter 13 failures','brutus',60);

// ============ V. VERIFY (5) ============
add('verify','Vera round 3 health score','vera',70);
add('verify','Brutus V2 verify P2-P20','brutus',65);
add('verify','Sentinel V3 security verify','sentinel',65);
add('verify','End-to-end smoke test','cobalt',60);
add('verify','Final sign-off','vera',40);

const board = {
  version: 4,
  lastUpdated: new Date().toISOString(),
  totalTasks: tasks.length,
  completed: 0,
  inProgress: 0,
  queue: tasks
};

fs.writeFileSync('docs/task-board.json', JSON.stringify(board, null, 2));
console.log('Total tasks:', tasks.length);
const c = {};
tasks.forEach(t => c[t.cat] = (c[t.cat]||0)+1);
console.log('By category:');
Object.entries(c).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log('  '+k+': '+v));
const r = {};
tasks.forEach(t => r[t.role] = (r[t.role]||0)+1);
console.log('By role:');
Object.entries(r).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log('  '+k+': '+v));
