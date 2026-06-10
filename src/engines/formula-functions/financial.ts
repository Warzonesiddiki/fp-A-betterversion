// =============================================================================
// FORMULA FUNCTION REGISTRY — Financial, Growth, Allocation & Currency
// =============================================================================
import type { FormulaFunction } from './helpers';
import { flattenNums } from './helpers';

// =============================================================================
// FINANCIAL FUNCTIONS
// =============================================================================

export function EBITDA(r: number, c: number, o: number): number {
  return r - c - o;
}
export function EBIT(e: number, d: number): number {
  return e - d;
}
export function NOPAT(e: number, t: number): number {
  return e * (1 - t);
}
export function FCFF(n: number, d: number, c: number, w: number): number {
  return n + d - c - w;
}
export function FCFE(f: number, b: number): number {
  return f + b;
}
export function WACC(ew: number, ce: number, dw: number, cd: number, t: number): number {
  return ew * ce + dw * cd * (1 - t);
}
export function NPV(rate: number, cf: number): number {
  let npv = 0;
  const cfs = Array.isArray(cf) ? cf : [cf];
  for (let i = 0; i < cfs.length; i++) npv += cfs[i] / Math.pow(1 + rate, i);
  return npv;
}
export function IRR(cf: number, guess = 0.1): number {
  const cfs = Array.isArray(cf) ? cf : [cf];
  let rate = guess;
  for (let i = 0; i < 100; i++) {
    let npv = 0,
      dnpv = 0;
    for (let j = 0; j < cfs.length; j++) {
      const pv = cfs[j] / Math.pow(1 + rate, j);
      npv += pv;
      if (j > 0) dnpv -= (j * pv) / (1 + rate);
    }
    if (dnpv === 0) return rate;
    const nr = rate - npv / dnpv;
    if (!isFinite(nr) || isNaN(nr)) return rate;
    if (Math.abs(nr - rate) < 1e-10) return nr;
    rate = nr;
  }
  return rate;
}
export function PV(r: number, n: number, pmt: number, fv = 0): number {
  return r === 0
    ? -(fv + pmt * n)
    : -(fv + pmt * ((Math.pow(1 + r, n) - 1) / r)) / Math.pow(1 + r, n);
}
export function FV(r: number, n: number, pmt: number, pv = 0): number {
  return r === 0
    ? -(pv + pmt * n)
    : -(pv * Math.pow(1 + r, n) + pmt * ((Math.pow(1 + r, n) - 1) / r));
}
export function PMT(r: number, n: number, pv: number, fv = 0): number {
  return r === 0
    ? -(pv + fv) / n
    : (-(pv * Math.pow(1 + r, n) + fv) * r) / (Math.pow(1 + r, n) - 1);
}
export function CAGR(bv: number, ev: number, y: number): number {
  return bv <= 0 || y <= 0 ? 0 : Math.pow(ev / bv, 1 / y) - 1;
}
export function PAYBACK(cf: number): number {
  const cfs = Array.isArray(cf) ? cf : [cf];
  let c = 0;
  for (let i = 0; i < cfs.length; i++) {
    c += cfs[i];
    if (c >= 0) return i;
  }
  return -1;
}
export function DPO(c: number, ap: number, d = 365): number {
  return c === 0 ? 0 : (ap / c) * d;
}
export function DSI(inv: number, c: number, d = 365): number {
  return c === 0 ? 0 : (inv / c) * d;
}
export function DSO(r: number, ar: number, d = 365): number {
  return r === 0 ? 0 : (ar / r) * d;
}
export function XIRR(cfs: number, dates: number, guess = 0.1): number {
  const flows = Array.isArray(cfs) ? cfs : [cfs];
  const dts = Array.isArray(dates) ? dates : [dates];
  const d0 = dts[0];
  let rate = guess;
  for (let i = 0; i < 100; i++) {
    let npv = 0,
      dnpv = 0;
    for (let j = 0; j < flows.length; j++) {
      const years = (dts[j] - d0) / 365.25;
      const pv = flows[j] / Math.pow(1 + rate, years);
      npv += pv;
      dnpv -= (years * pv) / (1 + rate);
    }
    if (dnpv === 0) return rate;
    const nr = rate - npv / dnpv;
    if (!isFinite(nr) || isNaN(nr)) return rate;
    if (Math.abs(nr - rate) < 1e-10) return nr;
    rate = nr;
  }
  return rate;
}
export function XNPV(rate: number, cfs: number, dates: number): number {
  const flows = Array.isArray(cfs) ? cfs : [cfs];
  const dts = Array.isArray(dates) ? dates : [dates];
  const d0 = dts[0];
  return flows.reduce((s, f, i) => s + f / Math.pow(1 + rate, (dts[i] - d0) / 365.25), 0);
}
export function IPMT(r: number, per: number, n: number, pv: number, fv = 0): number {
  const pmt = PMT(r, n, pv, fv);
  const bal = PV(r, per - 1, pmt, fv);
  return bal * r;
}
export function PPMT(r: number, per: number, n: number, pv: number, fv = 0): number {
  return PMT(r, n, pv, fv) - IPMT(r, per, n, pv, fv);
}
export function NPER(r: number, pmt: number, pv: number, fv = 0): number {
  if (r === 0) return -(pv + fv) / pmt;
  return Math.log((pmt - fv * r) / (pv * r + pmt)) / Math.log(1 + r);
}
export function RATE(n: number, pmt: number, pv: number, fv = 0, guess = 0.1): number {
  let r = guess;
  for (let i = 0; i < 100; i++) {
    const pow1rn = Math.pow(1 + r, n);
    const f = pv * pow1rn + pmt * ((pow1rn - 1) / r) + fv;
    const df =
      n * pv * Math.pow(1 + r, n - 1) +
      (pmt * (n * Math.pow(1 + r, n - 1) * r - (pow1rn - 1))) / (r * r);
    if (df === 0) return r;
    const nr = r - f / df;
    if (!isFinite(nr) || isNaN(nr)) return r;
    if (Math.abs(nr - r) < 1e-10) return nr;
    r = nr;
  }
  return r;
}
export function SLN(cost: number, salvage: number, life: number): number {
  return (cost - salvage) / life;
}
export function DB(cost: number, salvage: number, life: number, per: number): number {
  const rate = 1 - Math.pow(salvage / cost, 1 / life);
  let dep = cost * rate;
  for (let i = 1; i < per; i++) dep -= (cost - dep) * rate;
  return dep;
}
export function SYD(cost: number, salvage: number, life: number, per: number): number {
  return ((cost - salvage) * (life - per + 1)) / ((life * (life + 1)) / 2);
}
export function DDB(cost: number, salvage: number, life: number, per: number): number {
  const rate = 2 / life;
  let bv = cost,
    dep = 0;
  for (let i = 1; i <= per; i++) {
    dep = Math.min(bv * rate, bv - salvage);
    bv -= dep;
  }
  return dep;
}
export function VDB(
  cost: number,
  salvage: number,
  life: number,
  start: number,
  end: number
): number {
  let total = 0;
  for (let i = Math.ceil(start); i <= Math.floor(end); i++) total += DDB(cost, salvage, life, i);
  return total;
}
export function EFFECT(nom: number, npery: number): number {
  return Math.pow(1 + nom / npery, npery) - 1;
}
export function NOMINAL(eff: number, npery: number): number {
  return npery * (Math.pow(1 + eff, 1 / npery) - 1);
}
export function MDURATION(
  _settlement: number,
  _maturity: number,
  _coupon: number,
  _yld: number,
  _freq: number
): number {
  return DURATION(_settlement, _maturity, _coupon, _yld, _freq) / (1 + _yld / _freq);
}
export function DURATION(
  _settlement: number,
  _maturity: number,
  _coupon: number,
  _yld: number,
  _freq: number
): number {
  const n = Math.ceil(((_maturity - _settlement) / 365.25) * _freq);
  const c = _coupon / _freq;
  let num = 0,
    den = 0;
  for (let i = 1; i <= n; i++) {
    const pv = c / Math.pow(1 + _yld / _freq, i);
    num += i * pv;
    den += pv;
  }
  return num / den / _freq;
}
export function CUMIPMT(
  rate: number,
  nper: number,
  pv: number,
  start: number,
  end: number,
  _type: number
): number {
  let total = 0;
  for (let i = start; i <= end; i++) total += IPMT(rate, i, nper, pv);
  return total;
}
export function CUMPRINC(
  rate: number,
  nper: number,
  pv: number,
  start: number,
  end: number,
  _type: number
): number {
  let total = 0;
  for (let i = start; i <= end; i++) total += PPMT(rate, i, nper, pv);
  return total;
}

// =============================================================================
// GROWTH FUNCTIONS
// =============================================================================

export function GROWTH_RATE(c: number, p: number): number {
  return p === 0 ? 0 : (c - p) / Math.abs(p);
}
export function YOY(c: number, p: number): number {
  return p === 0 ? 0 : (c - p) / Math.abs(p);
}
export function MOM(c: number, p: number): number {
  return p === 0 ? 0 : (c - p) / Math.abs(p);
}
export function YTD(v: unknown, m: number): number {
  const vals = Array.isArray(v) ? v : [v];
  let s = 0;
  for (let i = 0; i <= Math.min(m, vals.length - 1); i++) s += vals[i];
  return s;
}
export function QTD(v: unknown, q: number): number {
  const vals = Array.isArray(v) ? v : [v];
  const st = q * 3;
  let s = 0;
  for (let i = st; i < Math.min(st + 3, vals.length); i++) s += vals[i];
  return s;
}
export function ROLLING(v: unknown, w: number): number[] {
  const vals = Array.isArray(v) ? v : [v];
  if (w <= 0 || vals.length < w) return [];
  const r: number[] = [];
  for (let i = 0; i <= vals.length - w; i++) {
    let s = 0;
    for (let j = i; j < i + w; j++) s += vals[j];
    r.push(s / w);
  }
  return r;
}
export function TREND(v: unknown): number[] {
  const vals = Array.isArray(v) ? v : [v];
  if (vals.length < 2) return vals.slice();
  const n = vals.length;
  let sx = 0,
    sy = 0,
    sxy = 0,
    sx2 = 0;
  for (let i = 0; i < n; i++) {
    sx += i;
    sy += vals[i];
    sxy += i * vals[i];
    sx2 += i * i;
  }
  const sl = (n * sxy - sx * sy) / (n * sx2 - sx * sx);
  const ic = (sy - sl * sx) / n;
  return vals.map((_: number, i: number) => ic + sl * i);
}
export function MOVING_AVERAGE(v: number, w: number): number[] {
  return ROLLING(v, w);
}
export function WEIGHTED_AVERAGE(v: number, w: number): number {
  const vals = Array.isArray(v) ? v : [v];
  const wgts = Array.isArray(w) ? w : [w];
  if (vals.length !== wgts.length) throw new Error('Values and weights must match');
  let s = 0,
    ws = 0;
  for (let i = 0; i < vals.length; i++) {
    s += vals[i] * wgts[i];
    ws += wgts[i];
  }
  return ws === 0 ? 0 : s / ws;
}
export function PERCENTILE(v: unknown, p: number): number {
  const valid = flattenNums(Array.isArray(v) ? v : [v]);
  if (valid.length === 0) return 0;
  const sorted = [...valid].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx),
    hi = Math.ceil(idx);
  return lo === hi ? sorted[lo]! : sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (idx - lo);
}

// =============================================================================
// ALLOCATION FUNCTIONS
// =============================================================================

export function ALLOCATE(a: number, w: number): number[] {
  const wgts = Array.isArray(w) ? w : [w];
  const t = wgts.reduce((s: number, v: number) => s + v, 0);
  return t === 0 ? wgts.map(() => 0) : wgts.map((v) => (v / t) * a);
}
export function SPREAD(a: number, p: number): number[] {
  return p <= 0 ? [] : Array.from({ length: p }, () => a / p);
}
export function DISTRIBUTE(a: number, d: number): number[] {
  const dist = Array.isArray(d) ? d : [d];
  const t = dist.reduce((s: number, v: number) => s + v, 0);
  return t === 0 ? dist.map(() => 0) : dist.map((v) => (v / t) * a);
}
export function SPLIT(a: number, r: number): number[] {
  const rats = Array.isArray(r) ? r : [r];
  const t = rats.reduce((s: number, v: number) => s + v, 0);
  return t === 0 ? rats.map(() => 0) : rats.map((v) => (v / t) * a);
}
export function PRO_RATA(a: number, b: number, t: number): number {
  return t === 0 ? 0 : (b / t) * a;
}

// =============================================================================
// CURRENCY FUNCTIONS
// =============================================================================

export function CONVERT_CURRENCY(a: number, r: number): number {
  return a * r;
}
export function TRANSLATE(a: number, r: number): number {
  return a * r;
}
export function ELIMINATE(a: number, p: number): number {
  return a * (1 - p);
}
export function FX_GAIN_LOSS(a: number, or: number, cr: number): number {
  return a * (cr - or);
}
export function HYPERINFLATION_ADJUST(a: number, ic: number, ib: number): number {
  return ib === 0 ? 0 : a * (ic / ib);
}

// =============================================================================
// ADDITIONAL FINANCIAL (bond/depreciation extras)
// =============================================================================

export function YIELD(
  _settlement: number,
  _maturity: number,
  _rate: number,
  _pr: number,
  _redemption: number,
  _freq: number
): number {
  const n = ((_maturity - _settlement) / 365.25) * _freq;
  const c = (_rate * _redemption) / _freq;
  let y = _rate;
  for (let iter = 0; iter < 50; iter++) {
    let pv = 0;
    for (let i = 1; i <= n; i++) pv += c / Math.pow(1 + y / _freq, i);
    pv += _redemption / Math.pow(1 + y / _freq, n);
    const dpv = 0;
    const nr = y - (pv - _pr) / (dpv || 1);
    if (Math.abs(nr - y) < 1e-10) return nr;
    y = nr;
  }
  return y;
}

// =============================================================================
// REGISTER ALL FINANCIAL/GROWTH/ALLOCATION/CURRENCY FUNCTIONS
// =============================================================================

export function registerFinancialFunctions(r: (fn: FormulaFunction) => void): void {
  // Helper to cast typed functions to FormulaFunction['impl']
  const impl = (fn: (...args: any[]) => any): FormulaFunction['impl'] =>
    fn as FormulaFunction['impl'];
  // Financial
  r({
    name: 'EBITDA',
    category: 'financial',
    description: 'Earnings before interest, taxes, depreciation, and amortization',
    minArgs: 3,
    maxArgs: 3,
    impl: impl(EBITDA),
  });
  r({
    name: 'EBIT',
    category: 'financial',
    description: 'Earnings before interest and taxes',
    minArgs: 2,
    maxArgs: 2,
    impl: impl(EBIT),
  });
  r({
    name: 'NOPAT',
    category: 'financial',
    description: 'Net operating profit after tax',
    minArgs: 2,
    maxArgs: 2,
    impl: impl(NOPAT),
  });
  r({
    name: 'FCFF',
    category: 'financial',
    description: 'Free cash flow to firm',
    minArgs: 4,
    maxArgs: 4,
    impl: impl(FCFF),
  });
  r({
    name: 'FCFE',
    category: 'financial',
    description: 'Free cash flow to equity',
    minArgs: 2,
    maxArgs: 2,
    impl: impl(FCFE),
  });
  r({
    name: 'WACC',
    category: 'financial',
    description: 'Weighted average cost of capital',
    minArgs: 5,
    maxArgs: 5,
    impl: impl(WACC),
  });
  r({
    name: 'NPV',
    category: 'financial',
    description: 'Net present value',
    minArgs: 2,
    maxArgs: -1,
    impl: impl(NPV),
  });
  r({
    name: 'IRR',
    category: 'financial',
    description: 'Internal rate of return',
    minArgs: 1,
    maxArgs: 2,
    impl: impl(IRR),
  });
  r({
    name: 'PV',
    category: 'financial',
    description: 'Present value',
    minArgs: 3,
    maxArgs: 4,
    impl: impl(PV),
  });
  r({
    name: 'FV',
    category: 'financial',
    description: 'Future value',
    minArgs: 3,
    maxArgs: 4,
    impl: impl(FV),
  });
  r({
    name: 'PMT',
    category: 'financial',
    description: 'Payment per period',
    minArgs: 3,
    maxArgs: 4,
    impl: impl(PMT),
  });
  r({
    name: 'CAGR',
    category: 'financial',
    description: 'Compound annual growth rate',
    minArgs: 3,
    maxArgs: 3,
    impl: impl(CAGR),
  });
  r({
    name: 'PAYBACK',
    category: 'financial',
    description: 'Payback period',
    minArgs: 1,
    maxArgs: -1,
    impl: impl(PAYBACK),
  });
  r({
    name: 'DPO',
    category: 'financial',
    description: 'Days payable outstanding',
    minArgs: 2,
    maxArgs: 3,
    impl: impl(DPO),
  });
  r({
    name: 'DSI',
    category: 'financial',
    description: 'Days sales of inventory',
    minArgs: 2,
    maxArgs: 3,
    impl: impl(DSI),
  });
  r({
    name: 'DSO',
    category: 'financial',
    description: 'Days sales outstanding',
    minArgs: 2,
    maxArgs: 3,
    impl: impl(DSO),
  });
  r({
    name: 'XIRR',
    category: 'financial',
    description: 'Internal rate of return for irregular cash flows',
    minArgs: 2,
    maxArgs: 3,
    impl: impl(XIRR),
  });
  r({
    name: 'XNPV',
    category: 'financial',
    description: 'Net present value for irregular cash flows',
    minArgs: 3,
    maxArgs: 3,
    impl: impl(XNPV),
  });
  r({
    name: 'IPMT',
    category: 'financial',
    description: 'Interest payment for a given period',
    minArgs: 4,
    maxArgs: 5,
    impl: impl(IPMT),
  });
  r({
    name: 'PPMT',
    category: 'financial',
    description: 'Principal payment for a given period',
    minArgs: 4,
    maxArgs: 5,
    impl: impl(PPMT),
  });
  r({
    name: 'NPER',
    category: 'financial',
    description: 'Number of periods',
    minArgs: 3,
    maxArgs: 4,
    impl: impl(NPER),
  });
  r({
    name: 'RATE',
    category: 'financial',
    description: 'Interest rate per period',
    minArgs: 3,
    maxArgs: 4,
    impl: impl(RATE),
  });
  r({
    name: 'SLN',
    category: 'financial',
    description: 'Straight-line depreciation',
    minArgs: 3,
    maxArgs: 3,
    impl: impl(SLN),
  });
  r({
    name: 'DB',
    category: 'financial',
    description: 'Declining balance depreciation',
    minArgs: 4,
    maxArgs: 4,
    impl: impl(DB),
  });
  r({
    name: 'SYD',
    category: 'financial',
    description: 'Sum-of-years digits depreciation',
    minArgs: 4,
    maxArgs: 4,
    impl: impl(SYD),
  });
  r({
    name: 'DDB',
    category: 'financial',
    description: 'Double declining balance depreciation',
    minArgs: 4,
    maxArgs: 4,
    impl: impl(DDB),
  });
  r({
    name: 'VDB',
    category: 'financial',
    description: 'Variable declining balance depreciation',
    minArgs: 5,
    maxArgs: 5,
    impl: impl(VDB),
  });
  r({
    name: 'EFFECT',
    category: 'financial',
    description: 'Effective annual interest rate',
    minArgs: 2,
    maxArgs: 2,
    impl: impl(EFFECT),
  });
  r({
    name: 'NOMINAL',
    category: 'financial',
    description: 'Nominal annual interest rate',
    minArgs: 2,
    maxArgs: 2,
    impl: impl(NOMINAL),
  });
  r({
    name: 'ACCRINT',
    category: 'financial',
    description: 'Accrued interest',
    minArgs: 6,
    maxArgs: 6,
    impl: impl(
      (
        _issue: number,
        _first: number,
        _settlement: number,
        _rate: number,
        _par: number,
        _freq: number
      ) => {
        const days = (_settlement - _issue) / 365.25;
        return _par * _rate * days;
      }
    ),
  });
  r({
    name: 'PRICE',
    category: 'financial',
    description: 'Bond price',
    minArgs: 6,
    maxArgs: 6,
    impl: impl(
      (
        _settlement: number,
        _maturity: number,
        _rate: number,
        _yld: number,
        _redemption: number,
        _freq: number
      ) => {
        const n = ((_maturity - _settlement) / 365.25) * _freq;
        const c = (_rate * _redemption) / _freq;
        let p = 0;
        for (let i = 1; i <= n; i++) p += c / Math.pow(1 + _yld / _freq, i);
        p += _redemption / Math.pow(1 + _yld / _freq, n);
        return p;
      }
    ),
  });
  r({
    name: 'YIELD',
    category: 'financial',
    description: 'Bond yield',
    minArgs: 6,
    maxArgs: 6,
    impl: impl(YIELD),
  });
  r({
    name: 'DISC',
    category: 'financial',
    description: 'Bond discount rate',
    minArgs: 4,
    maxArgs: 4,
    impl: impl((_settlement: number, _maturity: number, _pr: number, _redemption: number) => {
      const n = (_maturity - _settlement) / 365.25;
      return (_redemption - _pr) / _redemption / n;
    }),
  });
  r({
    name: 'PRICEDISC',
    category: 'financial',
    description: 'Price of discounted security',
    minArgs: 4,
    maxArgs: 4,
    impl: impl((_settlement: number, _maturity: number, _discount: number, _redemption: number) => {
      const n = (_maturity - _settlement) / 365.25;
      return _redemption * (1 - _discount * n);
    }),
  });
  r({
    name: 'RECEIVED',
    category: 'financial',
    description: 'Amount received at maturity',
    minArgs: 4,
    maxArgs: 4,
    impl: impl((_settlement: number, _maturity: number, _investment: number, _discount: number) => {
      const n = (_maturity - _settlement) / 365.25;
      return _investment / (1 - _discount * n);
    }),
  });
  r({
    name: 'INTRATE',
    category: 'financial',
    description: 'Interest rate',
    minArgs: 4,
    maxArgs: 4,
    impl: impl(
      (_settlement: number, _maturity: number, _investment: number, _redemption: number) => {
        const n = (_maturity - _settlement) / 365.25;
        return (_redemption - _investment) / _investment / n;
      }
    ),
  });
  r({
    name: 'TBILLEQ',
    category: 'financial',
    description: 'T-bill equivalent yield',
    minArgs: 3,
    maxArgs: 3,
    impl: impl((_settlement: number, _maturity: number, _discount: number) => {
      const n = (_maturity - _settlement) / 365.25;
      return (360 * _discount) / (360 - _discount * n * 100);
    }),
  });
  r({
    name: 'TBILLPRICE',
    category: 'financial',
    description: 'T-bill price',
    minArgs: 3,
    maxArgs: 3,
    impl: impl((_settlement: number, _maturity: number, _discount: number) => {
      const n = (_maturity - _settlement) / 365.25;
      return 100 * (1 - _discount * n);
    }),
  });
  r({
    name: 'TBILLYIELD',
    category: 'financial',
    description: 'T-bill yield',
    minArgs: 3,
    maxArgs: 3,
    impl: impl((_settlement: number, _maturity: number, _pr: number) => {
      const n = (_maturity - _settlement) / 365.25;
      return (100 - _pr) / _pr / n;
    }),
  });
  r({
    name: 'COUPNUM',
    category: 'financial',
    description: 'Number of coupons',
    minArgs: 3,
    maxArgs: 3,
    impl: impl((_settlement: number, _maturity: number, _freq: number) =>
      Math.ceil(((_maturity - _settlement) / 365.25) * _freq)
    ),
  });
  r({
    name: 'COUPDAYS',
    category: 'financial',
    description: 'Days in coupon period',
    minArgs: 3,
    maxArgs: 3,
    impl: (_settlement: number, _maturity: number, _freq: number) => 365.25 / _freq,
  });
  r({
    name: 'COUPDAYBS',
    category: 'financial',
    description: 'Days from beginning of coupon',
    minArgs: 3,
    maxArgs: 3,
    impl: (_settlement: number, _maturity: number, _freq: number) => {
      const period = 365.25 / _freq;
      return period - ((_maturity - _settlement) % period);
    },
  });
  r({
    name: 'COUPPCD',
    category: 'financial',
    description: 'Previous coupon date',
    minArgs: 3,
    maxArgs: 3,
    impl: impl((_settlement: number, _maturity: number, _freq: number) => {
      const period = 365.25 / _freq;
      return _settlement - ((_maturity - _settlement) % period);
    }),
  });
  r({
    name: 'COUPNCD',
    category: 'financial',
    description: 'Next coupon date',
    minArgs: 3,
    maxArgs: 3,
    impl: impl((_settlement: number, _maturity: number, _freq: number) => {
      const period = 365.25 / _freq;
      return _settlement + period - ((_maturity - _settlement) % period);
    }),
  });
  r({
    name: 'DURATION',
    category: 'financial',
    description: 'Macaulay duration',
    minArgs: 5,
    maxArgs: 5,
    impl: impl(DURATION),
  });
  r({
    name: 'MDURATION',
    category: 'financial',
    description: 'Modified duration',
    minArgs: 5,
    maxArgs: 5,
    impl: impl(MDURATION),
  });
  r({
    name: 'RRI',
    category: 'financial',
    description: 'Equivalent interest rate',
    minArgs: 3,
    maxArgs: 3,
    impl: impl((n: number, pv: number, fv: number) => Math.pow(fv / pv, 1 / n) - 1),
  });
  r({
    name: 'ISPMT',
    category: 'financial',
    description: 'Interest for specified period',
    minArgs: 4,
    maxArgs: 4,
    impl: (rate: number, per: number, nper: number, pv: number) => pv * rate * (per / nper - 1),
  });
  r({
    name: 'ACCRINTM',
    category: 'financial',
    description: 'Accrued interest at maturity',
    minArgs: 4,
    maxArgs: 4,
    impl: (_issue: number, _settlement: number, _rate: number, _par: number) => {
      const days = (_settlement - _issue) / 365.25;
      return _par * _rate * days;
    },
  });
  r({
    name: 'AMORDEGRC',
    category: 'financial',
    description: 'Depreciation with coefficient',
    minArgs: 6,
    maxArgs: 6,
    impl: impl(
      (
        cost: number,
        purchase: number,
        firstPeriod: number,
        salvage: number,
        period: number,
        rate: number
      ) => {
        const coeff = period <= 1 ? 1 : period <= 3 ? 1.5 : period <= 5 ? 2 : 2.5;
        const dep = cost * rate * coeff;
        return Math.max(0, Math.min(dep, cost - salvage));
      }
    ),
  });
  r({
    name: 'AMORLINC',
    category: 'financial',
    description: 'Linear depreciation',
    minArgs: 6,
    maxArgs: 6,
    impl: impl(
      (
        cost: number,
        purchase: number,
        firstPeriod: number,
        salvage: number,
        period: number,
        rate: number
      ) => {
        const life = 1 / rate;
        const depPerPeriod = (cost - salvage) / life;
        return Math.min(depPerPeriod, cost - salvage);
      }
    ),
  });
  r({
    name: 'COUPDAYSNC',
    category: 'financial',
    description: 'Days from settlement to next coupon',
    minArgs: 3,
    maxArgs: 3,
    impl: impl((_settlement: number, _maturity: number, _freq: number) => {
      const period = 365.25 / _freq;
      return period - ((_maturity - _settlement) % period);
    }),
  });
  r({
    name: 'CUMIPMT',
    category: 'financial',
    description: 'Cumulative interest paid',
    minArgs: 6,
    maxArgs: 6,
    impl: impl(CUMIPMT),
  });
  r({
    name: 'CUMPRINC',
    category: 'financial',
    description: 'Cumulative principal paid',
    minArgs: 6,
    maxArgs: 6,
    impl: impl(CUMPRINC),
  });
  r({
    name: 'DOLLARDE',
    category: 'financial',
    description: 'Dollar price from fraction',
    minArgs: 2,
    maxArgs: 2,
    impl: impl((fractional: number, fraction: number) => {
      const d = Math.floor(fractional);
      const f = fractional - d;
      return d + (f * 100) / fraction;
    }),
  });
  r({
    name: 'DOLLARFR',
    category: 'financial',
    description: 'Dollar price to fraction',
    minArgs: 2,
    maxArgs: 2,
    impl: impl((decimal: number, fraction: number) => {
      const d = Math.floor(decimal);
      const f = decimal - d;
      return d + (f * fraction) / 100;
    }),
  });
  r({
    name: 'ODDFPRICE',
    category: 'financial',
    description: 'Price of security with odd first period',
    minArgs: 8,
    maxArgs: 8,
    impl: impl(
      (
        _settlement: number,
        _maturity: number,
        _issue: number,
        _firstCoupon: number,
        _rate: number,
        _yld: number,
        _redemption: number,
        _freq: number
      ) => {
        const n = ((_maturity - _settlement) / 365.25) * _freq;
        const c = (_rate * _redemption) / _freq;
        let p = 0;
        for (let i = 1; i <= n; i++) p += c / Math.pow(1 + _yld / _freq, i);
        p += _redemption / Math.pow(1 + _yld / _freq, n);
        return p;
      }
    ),
  });
  r({
    name: 'ODDFYIELD',
    category: 'financial',
    description: 'Yield of security with odd first period',
    minArgs: 8,
    maxArgs: 8,
    impl: impl(
      (
        _settlement: number,
        _maturity: number,
        _issue: number,
        _firstCoupon: number,
        _rate: number,
        _pr: number,
        _redemption: number,
        _freq: number
      ) => YIELD(_settlement, _maturity, _rate, _pr, _redemption, _freq)
    ),
  });
  r({
    name: 'ODDLPRICE',
    category: 'financial',
    description: 'Price of security with odd last period',
    minArgs: 7,
    maxArgs: 7,
    impl: (
      _settlement: number,
      _maturity: number,
      _lastInterest: number,
      _rate: number,
      _yld: number,
      _redemption: number,
      _freq: number
    ) => {
      const n = ((_maturity - _settlement) / 365.25) * _freq;
      const c = (_rate * _redemption) / _freq;
      let p = 0;
      for (let i = 1; i <= n; i++) p += c / Math.pow(1 + _yld / _freq, i);
      p += _redemption / Math.pow(1 + _yld / _freq, n);
      return p;
    },
  });
  r({
    name: 'ODDLYIELD',
    category: 'financial',
    description: 'Yield of security with odd last period',
    minArgs: 7,
    maxArgs: 7,
    impl: impl(
      (
        _settlement: number,
        _maturity: number,
        _lastInterest: number,
        _rate: number,
        _pr: number,
        _redemption: number,
        _freq: number
      ) => YIELD(_settlement, _maturity, _rate, _pr, _redemption, _freq)
    ),
  });
  r({
    name: 'PRICEMAT',
    category: 'financial',
    description: 'Price at maturity',
    minArgs: 5,
    maxArgs: 5,
    impl: (_settlement: number, _maturity: number, _issue: number, _rate: number, _yld: number) => {
      const ds = (_settlement - _issue) / 365.25;
      const dm = (_maturity - _settlement) / 365.25;
      const b = ds / (ds + dm);
      return 100 + _rate * 100 * ds - _yld * 100 * dm * b;
    },
  });
  r({
    name: 'YIELDDISC',
    category: 'financial',
    description: 'Yield of discounted security',
    minArgs: 4,
    maxArgs: 4,
    impl: impl((_settlement: number, _maturity: number, _pr: number, _redemption: number) => {
      const n = (_maturity - _settlement) / 365.25;
      return (_redemption - _pr) / _pr / n;
    }),
  });
  r({
    name: 'YIELDMAT',
    category: 'financial',
    description: 'Yield at maturity',
    minArgs: 5,
    maxArgs: 5,
    impl: impl(
      (_settlement: number, _maturity: number, _issue: number, _rate: number, _pr: number) => {
        const ds = (_settlement - _issue) / 365.25;
        const dm = (_maturity - _settlement) / 365.25;
        return (_rate * ds + 1 - _pr / 100) / ((_pr / 100) * dm);
      }
    ),
  });

  // Growth
  r({
    name: 'GROWTH_RATE',
    category: 'growth',
    description: 'Growth rate between two values',
    minArgs: 2,
    maxArgs: 2,
    impl: impl(GROWTH_RATE),
  });
  r({
    name: 'YOY',
    category: 'growth',
    description: 'Year-over-year growth',
    minArgs: 2,
    maxArgs: 2,
    impl: impl(YOY),
  });
  r({
    name: 'MOM',
    category: 'growth',
    description: 'Month-over-month growth',
    minArgs: 2,
    maxArgs: 2,
    impl: impl(MOM),
  });
  r({
    name: 'YTD',
    category: 'growth',
    description: 'Year-to-date sum',
    minArgs: 2,
    maxArgs: 2,
    impl: impl(YTD),
  });
  r({
    name: 'QTD',
    category: 'growth',
    description: 'Quarter-to-date sum',
    minArgs: 2,
    maxArgs: 2,
    impl: impl(QTD),
  });
  r({
    name: 'ROLLING',
    category: 'growth',
    description: 'Rolling average',
    minArgs: 2,
    maxArgs: 2,
    impl: impl(ROLLING),
  });
  r({
    name: 'TREND',
    category: 'growth',
    description: 'Linear trend values',
    minArgs: 1,
    maxArgs: -1,
    impl: impl(TREND),
  });
  r({
    name: 'MOVING_AVERAGE',
    category: 'growth',
    description: 'Moving average',
    minArgs: 2,
    maxArgs: 2,
    impl: impl(MOVING_AVERAGE),
  });
  r({
    name: 'WEIGHTED_AVERAGE',
    category: 'growth',
    description: 'Weighted average',
    minArgs: 2,
    maxArgs: -1,
    impl: impl(WEIGHTED_AVERAGE),
  });
  r({
    name: 'PERCENTILE',
    category: 'growth',
    description: 'Percentile value',
    minArgs: 2,
    maxArgs: 2,
    impl: impl(PERCENTILE),
  });
  r({
    name: 'MTD',
    category: 'growth',
    description: 'Month-to-date sum',
    minArgs: 2,
    maxArgs: 2,
    impl: impl((v: unknown, m: number) => {
      const vals = Array.isArray(v) ? v : [v as number];
      const monthStart = m - (m % 30);
      let s = 0;
      for (let i = monthStart; i <= Math.min(m, vals.length - 1); i++) s += vals[i];
      return s;
    }),
  });
  r({
    name: 'ITD',
    category: 'growth',
    description: 'Inception-to-date sum',
    minArgs: 2,
    maxArgs: 2,
    impl: impl((v: unknown, m: number) => {
      const vals = Array.isArray(v) ? v : [v as number];
      let s = 0;
      for (let i = 0; i <= Math.min(m, vals.length - 1); i++) s += vals[i];
      return s;
    }),
  });
  r({
    name: 'PARALLEL_PERIOD',
    category: 'growth',
    description: 'Value from parallel period',
    minArgs: 3,
    maxArgs: 3,
    impl: impl((v: unknown, current: number, offset: number) => {
      const vals = Array.isArray(v) ? v : [v as number];
      const idx = current - offset;
      return idx >= 0 && idx < vals.length ? vals[idx] : 0;
    }),
  });
  r({
    name: 'SAME_PERIOD_LAST_YEAR',
    category: 'growth',
    description: 'Value from same period last year',
    minArgs: 2,
    maxArgs: 2,
    impl: impl((v: unknown, current: number) => {
      const vals = Array.isArray(v) ? v : [v as number];
      const idx = current - 12;
      return idx >= 0 && idx < vals.length ? vals[idx] : 0;
    }),
  });
  r({
    name: 'OPENINGBALANCE',
    category: 'growth',
    description: 'Opening balance for period',
    minArgs: 2,
    maxArgs: 2,
    impl: impl((v: unknown, period: number) => {
      const vals = Array.isArray(v) ? v : [v as number];
      return period > 0 && period <= vals.length ? vals[period - 1] : 0;
    }),
  });
  r({
    name: 'CLOSINGBALANCE',
    category: 'growth',
    description: 'Closing balance for period',
    minArgs: 2,
    maxArgs: 2,
    impl: impl((v: unknown, period: number) => {
      const vals = Array.isArray(v) ? v : [v as number];
      return period >= 0 && period < vals.length ? vals[period] : 0;
    }),
  });
  r({
    name: 'PERIOD_TO_DATE',
    category: 'growth',
    description: 'Sum from period start to given period',
    minArgs: 3,
    maxArgs: 3,
    impl: impl((v: unknown, start: number, end: number) => {
      const vals = Array.isArray(v) ? v : [v as number];
      let s = 0;
      for (let i = Math.max(0, start); i <= Math.min(end, vals.length - 1); i++) s += vals[i];
      return s;
    }),
  });
  r({
    name: 'LAG',
    category: 'growth',
    description: 'Lagged value',
    minArgs: 2,
    maxArgs: 3,
    impl: impl((v: unknown, current: number, lag = 1) => {
      const vals = Array.isArray(v) ? v : [v as number];
      const idx = current - lag;
      return idx >= 0 && idx < vals.length ? vals[idx] : 0;
    }),
  });
  r({
    name: 'LEAD',
    category: 'growth',
    description: 'Leading value',
    minArgs: 2,
    maxArgs: 3,
    impl: impl((v: unknown, current: number, lead = 1) => {
      const vals = Array.isArray(v) ? v : [v as number];
      const idx = current + lead;
      return idx >= 0 && idx < vals.length ? vals[idx] : 0;
    }),
  });
  r({
    name: 'CUMULATIVE',
    category: 'growth',
    description: 'Cumulative sum array',
    minArgs: 1,
    maxArgs: 1,
    impl: impl((v: unknown) => {
      const vals = Array.isArray(v) ? v : [v as number];
      const result: number[] = [];
      let s = 0;
      for (const x of vals) {
        s += x;
        result.push(s);
      }
      return result;
    }),
  });
  r({
    name: 'GROWTH_RATE_SERIES',
    category: 'growth',
    description: 'Period-over-period growth rate series',
    minArgs: 1,
    maxArgs: 1,
    impl: impl((v: unknown) => {
      const vals = Array.isArray(v) ? v : [v as number];
      const result: number[] = [0];
      for (let i = 1; i < vals.length; i++)
        result.push(vals[i - 1] === 0 ? 0 : (vals[i] - vals[i - 1]) / Math.abs(vals[i - 1]));
      return result;
    }),
  });

  // Allocation
  r({
    name: 'ALLOCATE',
    category: 'allocation',
    description: 'Allocate amount by weights',
    minArgs: 2,
    maxArgs: 2,
    impl: impl(ALLOCATE),
  });
  r({
    name: 'SPREAD',
    category: 'allocation',
    description: 'Spread amount evenly',
    minArgs: 2,
    maxArgs: 2,
    impl: impl(SPREAD),
  });
  r({
    name: 'DISTRIBUTE',
    category: 'allocation',
    description: 'Distribute amount',
    minArgs: 2,
    maxArgs: 2,
    impl: impl(DISTRIBUTE),
  });
  r({
    name: 'SPLIT',
    category: 'allocation',
    description: 'Split amount by ratios',
    minArgs: 2,
    maxArgs: 2,
    impl: impl(SPLIT),
  });
  r({
    name: 'PRO_RATA',
    category: 'allocation',
    description: 'Pro-rata allocation',
    minArgs: 3,
    maxArgs: 3,
    impl: impl(PRO_RATA),
  });

  // Currency
  r({
    name: 'CONVERT_CURRENCY',
    category: 'currency',
    description: 'Convert amount by exchange rate',
    minArgs: 2,
    maxArgs: 2,
    impl: impl(CONVERT_CURRENCY),
  });
  r({
    name: 'TRANSLATE',
    category: 'currency',
    description: 'Translate amount for consolidation',
    minArgs: 2,
    maxArgs: 2,
    impl: impl(TRANSLATE),
  });
  r({
    name: 'ELIMINATE',
    category: 'currency',
    description: 'Eliminate intercompany percentage',
    minArgs: 2,
    maxArgs: 2,
    impl: impl(ELIMINATE),
  });
  r({
    name: 'FX_GAIN_LOSS',
    category: 'currency',
    description: 'Foreign exchange gain or loss',
    minArgs: 3,
    maxArgs: 3,
    impl: impl(FX_GAIN_LOSS),
  });
  r({
    name: 'HYPERINFLATION_ADJUST',
    category: 'currency',
    description: 'Hyperinflation adjustment',
    minArgs: 3,
    maxArgs: 3,
    impl: impl(HYPERINFLATION_ADJUST),
  });
}
