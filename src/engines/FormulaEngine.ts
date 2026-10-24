import {
  analyzeFormulas,
  solveIteratively,
  type IterativeConfig,
  type ConvergenceResult,
  type CircularGroup,
  DEFAULT_ITERATIVE_CONFIG,
} from './IterativeCalculationEngine';

export type FormulaNodeType = 'ref' | 'number' | 'op' | 'func' | 'range' | 'string';
export type FormulaOp = '+' | '-' | '*' | '/' | '=' | '<' | '>' | '<=' | '>=' | '<>';

export interface FormulaNode {
  type: FormulaNodeType;
  value: string;
  children: FormulaNode[];
}

export interface FormulaParseResult {
  valid: boolean;
  nodes: FormulaNode[];
  error?: string;
}

export interface FormulaEvalResult {
  value: number;
  error?: string;
  dependencies: string[];
}

export class FormulaEngine {
  static readonly MAX_FORMULA_LENGTH = 1000;
  static readonly MAX_NESTING_DEPTH = 100;
  static readonly MAX_ARRAY_SIZE = 100000;

  static parseFormula(formula: string): FormulaParseResult {
    if (formula === null || formula === undefined) {
      return { valid: false, nodes: [], error: 'No formula provided' };
    }

    if (typeof formula !== 'string') {
      return { valid: false, nodes: [], error: 'Formula must be a string' };
    }

    const trimmed = formula.trim();
    if (trimmed === '') {
      return { valid: true, nodes: [], error: undefined };
    }

    if (trimmed.length > this.MAX_FORMULA_LENGTH) {
      return {
        valid: false,
        nodes: [],
        error: `Formula exceeds maximum length of ${this.MAX_FORMULA_LENGTH} characters`,
      };
    }

    const cleanFormula = trimmed.startsWith('=') ? trimmed.substring(1) : trimmed;

    if (cleanFormula.trim() === '') {
      return { valid: true, nodes: [], error: undefined };
    }

    // Very basic tokenizer/parser for arithmetic and simple functions
    try {
      const nodes = this.tokenizeAndParse(cleanFormula);
      return { valid: true, nodes };
    } catch (e: unknown) {
      return { valid: false, nodes: [], error: e instanceof Error ? e.message : 'Parse error' };
    }
  }

  private static tokenizeAndParse(formula: string): FormulaNode[] {
    // Simple regex-based approach for demonstration
    // In a real app, this would be a proper lexer/parser
    const tokens =
      formula.match(/([A-Za-z_][A-Za-z0-9_.]*|[0-9]+(\.[0-9]+)?|<=|>=|<>|[+\-*/()=<>]|,|:)/g) || [];
    let current = 0;
    let depth = 0;

    const parseComparison = (): FormulaNode => {
      let node = parseExpression();
      while (
        current < tokens.length &&
        (tokens[current] === '>' ||
          tokens[current] === '<' ||
          tokens[current] === '>=' ||
          tokens[current] === '<=' ||
          tokens[current] === '=' ||
          tokens[current] === '<>')
      ) {
        const op = tokens[current++]!;
        const right = parseExpression();
        node = { type: 'op', value: op, children: [node, right] };
      }
      return node;
    };

    const parseExpression = (): FormulaNode => {
      let node = parseTerm();
      while (current < tokens.length && (tokens[current] === '+' || tokens[current] === '-')) {
        const op = tokens[current++]!;
        const right = parseTerm();
        node = { type: 'op', value: op, children: [node, right] };
      }
      return node;
    };

    const parseTerm = (): FormulaNode => {
      let node = parseFactor();
      while (current < tokens.length && (tokens[current] === '*' || tokens[current] === '/')) {
        const op = tokens[current++]!;
        const right = parseFactor();
        node = { type: 'op', value: op, children: [node, right] };
      }
      return node;
    };

    const parseFactor = (): FormulaNode => {
      const token = tokens[current++];
      if (!token) throw new Error('Unexpected end of formula');

      if (token === '(') {
        depth++;
        if (depth > FormulaEngine.MAX_NESTING_DEPTH) {
          throw new Error(
            `Formula nesting exceeds maximum depth of ${FormulaEngine.MAX_NESTING_DEPTH}`
          );
        }
        const node = parseExpression();
        if (tokens[current++] !== ')') throw new Error('Unbalanced parentheses');
        depth--;
        return node;
      }

      if (/^[0-9]/.test(token)) {
        return { type: 'number', value: token, children: [] };
      }

      if (/^[A-Za-z_]/.test(token)) {
        if (tokens[current] === '(') {
          const funcName = token;
          current++; // skip (
          const children: FormulaNode[] = [];
          if (tokens[current] !== ')') {
            children.push(parseComparison());
            while (tokens[current] === ',') {
              current++;
              children.push(parseComparison());
            }
          }
          if (tokens[current++] !== ')') throw new Error('Unbalanced parentheses in function');
          return { type: 'func', value: funcName, children };
        }

        if (tokens[current] === ':') {
          const start = token;
          current++; // skip :
          const end = tokens[current++];
          return { type: 'range', value: `${start}:${end}`, children: [] };
        }

        return { type: 'ref', value: token, children: [] };
      }

      throw new Error(`Unexpected token: ${token}`);
    };

    return [parseComparison()];
  }

  static evaluate(nodes: FormulaNode[], getCellValue: (ref: string) => number): FormulaEvalResult {
    const dependencies: string[] = [];

    if (nodes.length === 0) {
      return { value: 0, dependencies };
    }

    const safeDiv = (a: number, b: number): number => {
      if (b === 0) return 0;
      const result = a / b;
      return isNaN(result) ? 0 : result;
    };

    const evalNode = (node: FormulaNode): number => {
      switch (node.type) {
        case 'number':
          return parseFloat(node.value) || 0;
        case 'ref': {
          dependencies.push(node.value);
          return getCellValue(node.value);
        }
        case 'op': {
          const left = evalNode(node.children[0]!);
          const right = evalNode(node.children[1]!);
          switch (node.value as FormulaOp) {
            case '+':
              return left + right;
            case '-':
              return left - right;
            case '*':
              return left * right;
            case '/':
              return safeDiv(left, right);
            case '=':
              return left === right ? 1 : 0;
            case '<':
              return left < right ? 1 : 0;
            case '>':
              return left > right ? 1 : 0;
            case '<=':
              return left <= right ? 1 : 0;
            case '>=':
              return left >= right ? 1 : 0;
            case '<>':
              return left !== right ? 1 : 0;
            default:
              return 0;
          }
        }
        case 'func': {
          const funcName = node.value.toUpperCase();
          if (funcName === 'SUM') {
            return node.children.reduce((acc, child) => {
              if (child.type === 'range') {
                const rangeVals = this.evaluateRange(child.value, getCellValue);
                if (rangeVals.length > FormulaEngine.MAX_ARRAY_SIZE) return acc;
                return acc + rangeVals.reduce((sum, v) => sum + v, 0);
              }
              return acc + evalNode(child);
            }, 0);
          }
          if (funcName === 'IF') {
            const condition = evalNode(node.children[0]!);
            return condition !== 0 ? evalNode(node.children[1]!) : evalNode(node.children[2]!);
          }
          if (funcName === 'COUNT') {
            return node.children.reduce((acc, child) => {
              if (child.type === 'range') {
                const rangeVals = this.evaluateRange(child.value, getCellValue);
                if (rangeVals.length > FormulaEngine.MAX_ARRAY_SIZE) return acc;
                return acc + rangeVals.length;
              }
              return acc + 1;
            }, 0);
          }
          if (funcName === 'NPV') {
            const rate = evalNode(node.children[0]!);
            const cashflows = node.children.slice(1).flatMap((child) => {
              if (child.type === 'range') return this.evaluateRange(child.value, getCellValue);
              return [evalNode(child)];
            });
            if (cashflows.length > FormulaEngine.MAX_ARRAY_SIZE) return 0;
            return cashflows.reduce((acc, cf, i) => acc + cf / Math.pow(1 + rate, i + 1), 0);
          }
          if (funcName === 'CAGR') {
            const ev = evalNode(node.children[0]!);
            const bv = evalNode(node.children[1]!);
            const n = evalNode(node.children[2]!);
            if (bv <= 0 || n <= 0) return 0;
            return Math.pow(ev / bv, 1 / n) - 1;
          }
          return 0;
        }
        default:
          return 0;
      }
    };

    let result = 0;
    let error: string | undefined;

    try {
      result = evalNode(nodes[0]!);
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'Evaluation error';
    }

    return {
      value: result,
      error,
      dependencies: Array.from(new Set(dependencies)).sort(),
    };
  }

  private static evaluateRange(range: string, getCellValue: (ref: string) => number): number[] {
    const [start, end] = range.split(':');
    const startMatch = start!.match(/([A-Z]+)([0-9]+)/);
    const endMatch = end!.match(/([A-Z]+)([0-9]+)/);

    if (!startMatch || !endMatch) return [];

    const startCol = startMatch[1];
    const startRow = parseInt(startMatch[2]!);
    const endCol = endMatch[1];
    const endRow = parseInt(endMatch[2]!);

    const values: number[] = [];

    // Simple single-column or single-row range for now
    if (startCol === endCol) {
      for (let r = startRow; r <= endRow; r++) {
        values.push(getCellValue(`${startCol}${r}`));
      }
    } else if (startRow === endRow) {
      // Handle column range (A-Z only for simplicity)
      const startCode = startCol!.charCodeAt(0);
      const endCode = endCol!.charCodeAt(0);
      for (let c = startCode; c <= endCode; c++) {
        values.push(getCellValue(`${String.fromCharCode(c)}${startRow}`));
      }
    }

    return values;
  }

  static getDependencies(formula: string): string[] {
    const { nodes } = this.parseFormula(formula);
    if (nodes.length === 0) return [];

    const deps: string[] = [];
    const collect = (node: FormulaNode) => {
      if (node.type === 'ref') {
        deps.push(node.value);
      } else if (node.type === 'range') {
        // Expand range into individual cell references
        const [start, end] = node.value.split(':');
        const startMatch = start!.match(/([A-Z]+)([0-9]+)/);
        const endMatch = end!.match(/([A-Z]+)([0-9]+)/);
        if (startMatch && endMatch) {
          const startCol = startMatch[1];
          const startRow = parseInt(startMatch[2]!);
          const endCol = endMatch[1];
          const endRow = parseInt(endMatch[2]!);
          if (startCol === endCol) {
            for (let r = startRow; r <= endRow; r++) {
              deps.push(`${startCol}${r}`);
            }
          } else {
            const startCode = startCol!.charCodeAt(0);
            const endCode = endCol!.charCodeAt(0);
            for (let c = startCode; c <= endCode; c++) {
              for (let r = startRow; r <= endRow; r++) {
                deps.push(`${String.fromCharCode(c)}${r}`);
              }
            }
          }
        }
      }
      node.children.forEach(collect);
    };
    nodes.forEach(collect);
    return Array.from(new Set(deps)).sort();
  }

  static validateFormula(formula: string): { valid: boolean; error?: string } {
    const result = this.parseFormula(formula);
    return { valid: result.valid, error: result.error };
  }

  // =========================================================================
  // CIRCULAR REFERENCE DETECTION & ITERATIVE CALCULATION
  // =========================================================================

  /**
   * Analyze a set of cell formulas for circular references.
   * Returns cycle groups and the set of involved cells.
   */
  static analyzeForCircularReferences(cellFormulas: Map<string, string>): {
    cycles: CircularGroup[];
    circularCells: Set<string>;
    hasCircular: boolean;
  } {
    return analyzeFormulas(cellFormulas, (formula) => this.getDependencies(formula));
  }

  /**
   * Recalculate a set of cells with support for circular references.
   * If circular references exist and iterative calc is enabled, uses iterative solving.
   * Otherwise, performs single-pass topological recalculation.
   *
   * @param cellFormulas - Map of cell reference to formula string
   * @param getCellValue - Function to get current cell value
   * @param setCellValue - Function to set cell value
   * @param recalcCell - Function to recalculate a single cell (evaluates its formula)
   * @param config - Iterative calculation configuration
   * @returns Convergence result (only meaningful if circular references exist)
   */
  static recalculateWithCircularSupport(
    cellFormulas: Map<string, string>,
    getCellValue: (ref: string) => number,
    setCellValue: (ref: string, value: number) => void,
    recalcCell: (ref: string) => number,
    config: IterativeConfig = DEFAULT_ITERATIVE_CONFIG
  ): { convergence: ConvergenceResult | null; cycles: CircularGroup[] } {
    const analysis = this.analyzeForCircularReferences(cellFormulas);

    if (!analysis.hasCircular) {
      // No circular references — single-pass topological recalculation
      this.topologicalRecalc(cellFormulas, recalcCell);
      return { convergence: null, cycles: [] };
    }

    if (!config.enableIterativeCalc) {
      // Circular refs exist but iterative calc is disabled
      // Still do a single pass (values will be wrong for circular cells)
      this.topologicalRecalc(cellFormulas, recalcCell);
      return { convergence: null, cycles: analysis.cycles };
    }

    // Iterative calculation for circular cells
    const convergence = solveIteratively(
      analysis.circularCells,
      { getCellValue, setCellValue, recalcCell },
      config
    );

    return { convergence, cycles: analysis.cycles };
  }

  /**
   * Topological sort and recalculate non-circular cells in dependency order.
   * Circular cells are recalculated last (values may be stale until iterative pass).
   */
  private static topologicalRecalc(
    cellFormulas: Map<string, string>,
    recalcCell: (ref: string) => void
  ): void {
    const inDegree = new Map<string, number>();
    const dependents = new Map<string, Set<string>>();

    // Initialize
    for (const cell of Array.from(cellFormulas.keys())) {
      inDegree.set(cell, 0);
      dependents.set(cell, new Set());
    }

    // Build in-degree map
    for (const [cell, formula] of Array.from(cellFormulas)) {
      const deps = this.getDependencies(formula);
      for (const dep of deps) {
        if (cellFormulas.has(dep)) {
          inDegree.set(cell, (inDegree.get(cell) ?? 0) + 1);
          const depSet = dependents.get(dep);
          if (depSet) depSet.add(cell);
        }
      }
    }

    // Kahn's algorithm
    const queue: string[] = [];
    for (const [cell, deg] of Array.from(inDegree)) {
      if (deg === 0) queue.push(cell);
    }

    const sorted: string[] = [];
    while (queue.length > 0) {
      const node = queue.shift()!;
      sorted.push(node);
      for (const dependent of Array.from(dependents.get(node) ?? [])) {
        const newDeg = (inDegree.get(dependent) ?? 1) - 1;
        inDegree.set(dependent, newDeg);
        if (newDeg === 0) queue.push(dependent);
      }
    }

    // Recalculate in topological order
    for (const cell of sorted) {
      recalcCell(cell);
    }

    // Recalculate any remaining cells (those in circular groups)
    for (const cell of Array.from(cellFormulas.keys())) {
      if (!sorted.includes(cell)) {
        recalcCell(cell);
      }
    }
  }
}
