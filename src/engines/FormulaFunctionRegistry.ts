// =============================================================================
// FORMULA FUNCTION REGISTRY — 300+ FP&A Functions
// Pure TypeScript, deterministic, testable
// Barrel export: delegates to category modules
// =============================================================================

export type { FunctionCategory, FormulaFunction } from './formula-functions/helpers';

// Import category registration functions
import { registerFinancialFunctions } from './formula-functions/financial';
import { registerStatisticalFunctions } from './formula-functions/statistical';
import { registerMathFunctions } from './formula-functions/math';
import { registerTextFunctions } from './formula-functions/text';
import { registerLookupFunctions } from './formula-functions/lookup';
import { registerLogicalFunctions } from './formula-functions/logical';

// Import function implementations for static method delegation
import * as Financial from './formula-functions/financial';
import * as Statistical from './formula-functions/statistical';
import * as MathFns from './formula-functions/math';
import * as TextFns from './formula-functions/text';
import * as LookupFns from './formula-functions/lookup';
import * as LogicalFns from './formula-functions/logical';

import type { FormulaFunction } from './formula-functions/helpers';

// =============================================================================
// REGISTRY CLASS
// =============================================================================

export class FormulaFunctionRegistry {
  private static functions = new Map<string, FormulaFunction>();

  static register(fn: FormulaFunction): void {
    this.functions.set(fn.name.toUpperCase(), fn);
  }
  static get(name: string): FormulaFunction | undefined {
    return this.functions.get(name.toUpperCase());
  }
  static has(name: string): boolean {
    return this.functions.has(name.toUpperCase());
  }
  static list(): string[] {
    return Array.from(this.functions.keys());
  }
  static listByCategory(category: string): string[] {
    return Array.from(this.functions.values())
      .filter((fn) => fn.category === category)
      .map((fn) => fn.name);
  }
  static call(name: string, ...args: unknown[]): number | number[] {
    const fn = this.functions.get(name.toUpperCase());
    if (!fn) throw new Error(`Unknown function: ${name}`);
    if (args.length < fn.minArgs)
      throw new Error(`${name} requires at least ${fn.minArgs} arguments`);
    if (fn.maxArgs !== -1 && args.length > fn.maxArgs)
      throw new Error(`${name} accepts at most ${fn.maxArgs} arguments`);
    return fn.impl(...args);
  }

  // =========================================================================
  // FINANCIAL — static method delegation
  // =========================================================================
  static EBITDA = Financial.EBITDA;
  static EBIT = Financial.EBIT;
  static NOPAT = Financial.NOPAT;
  static FCFF = Financial.FCFF;
  static FCFE = Financial.FCFE;
  static WACC = Financial.WACC;
  static NPV = Financial.NPV;
  static IRR = Financial.IRR;
  static PV = Financial.PV;
  static FV = Financial.FV;
  static PMT = Financial.PMT;
  static CAGR = Financial.CAGR;
  static PAYBACK = Financial.PAYBACK;
  static DPO = Financial.DPO;
  static DSI = Financial.DSI;
  static DSO = Financial.DSO;
  static XIRR = Financial.XIRR;
  static XNPV = Financial.XNPV;
  static IPMT = Financial.IPMT;
  static PPMT = Financial.PPMT;
  static NPER = Financial.NPER;
  static RATE = Financial.RATE;
  static SLN = Financial.SLN;
  static DB = Financial.DB;
  static SYD = Financial.SYD;
  static DDB = Financial.DDB;
  static VDB = Financial.VDB;
  static EFFECT = Financial.EFFECT;
  static NOMINAL = Financial.NOMINAL;
  static DURATION = Financial.DURATION;
  static YIELD = Financial.YIELD;

  // Growth
  static GROWTH_RATE = Financial.GROWTH_RATE;
  static YOY = Financial.YOY;
  static MOM = Financial.MOM;
  static YTD = Financial.YTD;
  static QTD = Financial.QTD;
  static ROLLING = Financial.ROLLING;
  static TREND = Financial.TREND;
  static MOVING_AVERAGE = Financial.MOVING_AVERAGE;
  static WEIGHTED_AVERAGE = Financial.WEIGHTED_AVERAGE;
  static PERCENTILE = Financial.PERCENTILE;

  // Allocation
  static ALLOCATE = Financial.ALLOCATE;
  static SPREAD = Financial.SPREAD;
  static DISTRIBUTE = Financial.DISTRIBUTE;
  static SPLIT = Financial.SPLIT;
  static PRO_RATA = Financial.PRO_RATA;

  // Currency
  static CONVERT_CURRENCY = Financial.CONVERT_CURRENCY;
  static TRANSLATE = Financial.TRANSLATE;
  static ELIMINATE = Financial.ELIMINATE;
  static FX_GAIN_LOSS = Financial.FX_GAIN_LOSS;
  static HYPERINFLATION_ADJUST = Financial.HYPERINFLATION_ADJUST;

  // =========================================================================
  // STATISTICAL — static method delegation
  // =========================================================================
  static SUM = Statistical.SUM;
  static COUNT = Statistical.COUNT;
  static AVERAGE = Statistical.AVERAGE;
  static MEDIAN = Statistical.MEDIAN;
  static MODE = Statistical.MODE;
  static STDEV = Statistical.STDEV;
  static STDEVP = Statistical.STDEVP;
  static VARIANCE = Statistical.VARIANCE;
  static VARP = Statistical.VARP;
  static CORREL = Statistical.CORREL;
  static COVAR = Statistical.COVAR;
  static PERCENTRANK = Statistical.PERCENTRANK;
  static QUARTILE = Statistical.QUARTILE;
  static FORECAST = Statistical.FORECAST;
  static SLOPE = Statistical.SLOPE_FN;
  static INTERCEPT = Statistical.INTERCEPT_FN;
  static RSQ = Statistical.RSQ;
  static PEARSON = Statistical.PEARSON;
  static GEOMEAN = Statistical.GEOMEAN;
  static HARMEAN = Statistical.HARMEAN;
  static TRIMMEAN = Statistical.TRIMMEAN;
  static AVEDEV = Statistical.AVEDEV;
  static DEVSQ = Statistical.DEVSQ;
  static KURT = Statistical.KURT;
  static SKEW = Statistical.SKEW;
  static NORMDIST = Statistical.NORMDIST;
  static NORMINV = Statistical.NORMINV;
  static NORMSDIST = Statistical.NORMSDIST;
  static NORMSINV = Statistical.NORMSINV;
  static TDIST = Statistical.TDIST;
  static TINV = Statistical.TINV;
  static EXPONDIST = Statistical.EXPONDIST;
  static GAMMADIST = Statistical.GAMMADIST;
  static BETADIST = Statistical.BETADIST;
  static WEIBULL = Statistical.WEIBULL;
  static LOGNORMDIST = Statistical.LOGNORMDIST;
  static LOGINV = Statistical.LOGINV;
  static CHIDIST = Statistical.CHIDIST;
  static CHIINV = Statistical.CHIINV;
  static FDIST = Statistical.FDIST;
  static FINV = Statistical.FINV;
  static CONFIDENCE = Statistical.CONFIDENCE;
  static FISHER = Statistical.FISHER;
  static FISHERINV = Statistical.FISHERINV;
  static BINOMDIST = Statistical.BINOMDIST;
  static POISSON = Statistical.POISSON;
  static MIN = Statistical.MIN;
  static MAX = Statistical.MAX;
  static ABS = Statistical.ABS;

  // =========================================================================
  // LOGICAL — static method delegation
  // =========================================================================
  static IFS = LogicalFns.IFS;
  static CHOOSE = LogicalFns.CHOOSE;
  static BETWEEN = LogicalFns.BETWEEN;
  static CLAMP = LogicalFns.CLAMP;
  static COALESCE = LogicalFns.COALESCE;
  static AND = LogicalFns.AND;
  static OR = LogicalFns.OR;
  static NOT = LogicalFns.NOT;
  static XOR = LogicalFns.XOR;
  static IFERROR = LogicalFns.IFERROR;
  static IFNA = LogicalFns.IFNA;
  static SWITCH = LogicalFns.SWITCH;

  // =========================================================================
  // MATH — static method delegation
  // =========================================================================
  static ROUND = MathFns.ROUND;
  static ROUNDUP = MathFns.ROUNDUP;
  static ROUNDDOWN = MathFns.ROUNDDOWN;
  static MOD = MathFns.MOD;
  static POWER = MathFns.POWER;
  static SQRT = MathFns.SQRT;
  static LN = MathFns.LN;
  static LOG = MathFns.LOG;
  static LOG10 = MathFns.LOG10;
  static EXP = MathFns.EXP;
  static CEILING = MathFns.CEILING;
  static FLOOR = MathFns.FLOOR;
  static MROUND = MathFns.MROUND;
  static GCD = MathFns.GCD;
  static LCM = MathFns.LCM;
  static COMBIN = MathFns.COMBIN;
  static PERMUT = MathFns.PERMUT;
  static SUMPRODUCT = MathFns.SUMPRODUCT;
  static SUMIFS = MathFns.SUMIFS;
  static COUNTIFS = MathFns.COUNTIFS;
  static AVERAGEIF = MathFns.AVERAGEIF;
  static AVERAGEIFS = MathFns.AVERAGEIFS;
  static PRODUCT = MathFns.PRODUCT;
  static ERF = MathFns.ERF;
  static ERFC = MathFns.ERFC;

  // =========================================================================
  // TEXT — static method delegation
  // =========================================================================
  static LEN = TextFns.LEN;
  static CODE = TextFns.CODE;
  static CHAR = TextFns.CHAR;
  static VALUE = TextFns.VALUE;
  static T = TextFns.T;
  static N = TextFns.N;
  static EXACT = TextFns.EXACT;
  static UPPER = TextFns.UPPER;
  static LOWER = TextFns.LOWER;
  static TEXT = TextFns.TEXT;

  // Date
  static DATE = TextFns.DATE;
  static YEAR = TextFns.YEAR;
  static MONTH = TextFns.MONTH;
  static DAY = TextFns.DAY;
  static HOUR = TextFns.HOUR;
  static MINUTE = TextFns.MINUTE;
  static SECOND = TextFns.SECOND;
  static EOMONTH = TextFns.EOMONTH;
  static EDATE = TextFns.EDATE;
  static DATEDIF = TextFns.DATEDIF;
  static DAYS = TextFns.DAYS;
  static DAYS360 = TextFns.DAYS360;
  static YEARFRAC = TextFns.YEARFRAC;
  static NOW = TextFns.NOW;
  static TODAY = TextFns.TODAY;
  static TIME = TextFns.TIME;
  static WEEKNUM = TextFns.WEEKNUM;
  static ISOWEEKNUM = TextFns.ISOWEEKNUM;
  static NETWORKDAYS = TextFns.NETWORKDAYS;
  static WORKDAY = TextFns.WORKDAY;
  static WEEKDAY = TextFns.WEEKDAY;

  // =========================================================================
  // ENGINEERING — static method delegation (via math module)
  // =========================================================================
  static BIN2DEC = MathFns.BIN2DEC;
  static DEC2BIN = MathFns.DEC2BIN;
  static HEX2DEC = MathFns.HEX2DEC;
  static DEC2HEX = MathFns.DEC2HEX;
  static OCT2DEC = MathFns.OCT2DEC;
  static DEC2OCT = MathFns.DEC2OCT;
  static DELTA = MathFns.DELTA;
  static GESTEP = MathFns.GESTEP;
  static CONVERT = MathFns.CONVERT;

  // =========================================================================
  // ARRAY — static method delegation
  // =========================================================================
  static UNIQUE = LookupFns.UNIQUE;
  static SORT = LookupFns.SORT;
  static SORTBY = LookupFns.SORTBY;
  static SEQUENCE = LookupFns.SEQUENCE;
  static RANDARRAY = LookupFns.RANDARRAY;
  static TRANSPOSE = LookupFns.TRANSPOSE;
  static MMULT = LookupFns.MMULT;
  static MDETERM = LookupFns.MDETERM;
  static FILTER = LookupFns.FILTER;

  // =========================================================================
  // LOOKUP — static method delegation
  // =========================================================================
  static MATCH = LookupFns.MATCH;
  static XMATCH = LookupFns.XMATCH;
  static XLOOKUP = LookupFns.XLOOKUP;
  static VLOOKUP = LookupFns.VLOOKUP;
  static HLOOKUP = LookupFns.HLOOKUP;
  static OFFSET = LookupFns.OFFSET;
  static INDIRECT = LookupFns.INDIRECT;

  // =========================================================================
  // INFORMATION — static method delegation
  // =========================================================================
  static ISBLANK = LogicalFns.ISBLANK;
  static ISERR = LogicalFns.ISERR;
  static ISERROR = LogicalFns.ISERROR;
  static ISEVEN = LogicalFns.ISEVEN;
  static ISODD = LogicalFns.ISODD;
  static ISLOGICAL = LogicalFns.ISLOGICAL;
  static ISNA = LogicalFns.ISNA;
  static ISNONTEXT = LogicalFns.ISNONTEXT;
  static ISNUMBER = LogicalFns.ISNUMBER;
  static ISTEXT = LogicalFns.ISTEXT;
  static ISREF = LogicalFns.ISREF;
  static TYPE = LogicalFns.TYPE;
  static NA = LogicalFns.NA;
  static ERROR_TYPE = LogicalFns.ERROR_TYPE;
  static SHEET = LogicalFns.SHEET;
  static SHEETS = LogicalFns.SHEETS;

  // =========================================================================
  // REGISTER ALL
  // =========================================================================
  static initialize(): void {
    const r = this.register.bind(this);
    registerFinancialFunctions(r);
    registerStatisticalFunctions(r);
    registerMathFunctions(r);
    registerTextFunctions(r);
    registerLookupFunctions(r);
    registerLogicalFunctions(r);
  }
}

FormulaFunctionRegistry.initialize();
