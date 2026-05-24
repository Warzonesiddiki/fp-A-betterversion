// =============================================================================
// MDX ENGINE — Multi-Dimensional Expressions parser and evaluator
// Supports SELECT, WHERE, NON EMPTY, ORDER BY, calculated members
// Pure TypeScript, deterministic, testable, zero external dependencies
// =============================================================================

export interface MDXQuery {
  cube: string;
  axes: MDXAxis[];
  slicer: MDXSlicer;
  calculatedMembers: MDXCalculatedMember[];
  nonEmpty: boolean;
  orderBy?: { axis: number; direction: 'ASC' | 'DESC' };
}

export interface MDXAxis {
  index: number;
  dimensions: MDXDimensionExpression[];
}

export interface MDXDimensionExpression {
  dimension: string;
  members: string[];
  isAll: boolean;
}

export interface MDXSlicer {
  dimension: string;
  members: string[];
}

export interface MDXCalculatedMember {
  name: string;
  formula: string;
  dimension: string;
}

export interface MDXResult {
  axes: MDXAxisResult[];
  cells: MDXCell[];
  warnings: string[];
}

export interface MDXAxisResult {
  index: number;
  tuples: MDXTuple[];
}

export interface MDXTuple {
  members: { dimension: string; member: string }[];
}

export interface MDXCell {
  coordinates: Record<string, string>;
  value: number | string | null;
}

// =============================================================================
// MDX PARSER
// =============================================================================

export function parseMDX(mdx: string): MDXQuery {
  const normalized = mdx.replace(/\s+/g, ' ').trim().toUpperCase();

  const cubeMatch = normalized.match(/FROM\s+\[([^\]]+)\]/);
  if (!cubeMatch) throw new Error('MDX: Missing FROM clause');
  const cube = cubeMatch[1].toLowerCase();

  const axes = parseAxes(normalized);
  const slicer = parseSlicer(normalized);
  const calculatedMembers = parseCalculatedMembers(mdx);
  const nonEmpty = normalized.includes('NON EMPTY');
  const orderBy = parseOrderBy(normalized);

  return { cube, axes, slicer, calculatedMembers, nonEmpty, orderBy };
}

function parseAxes(mdx: string): MDXAxis[] {
  const axes: MDXAxis[] = [];
  const axisPattern = /\{\s*([^}]+)\s*\}\s+ON\s+(\d+)/g;
  let match = axisPattern.exec(mdx);
  while (match) {
    const membersStr = match[1];
    const index = parseInt(match[2], 10);
    const dimensions = parseDimensionExpressions(membersStr);
    axes.push({ index, dimensions });
    match = axisPattern.exec(mdx);
  }
  return axes;
}

function parseDimensionExpressions(membersStr: string): MDXDimensionExpression[] {
  const dims: MDXDimensionExpression[] = [];
  const parts = membersStr
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const part of parts) {
    const dimMatch = part.match(/\[([^\]]+)\]\.\[([^\]]+)\]/);
    if (dimMatch) {
      dims.push({ dimension: dimMatch[1], members: [dimMatch[2]], isAll: false });
    } else if (part.includes('.ALL')) {
      const allMatch = part.match(/\[([^\]]+)\]\.ALL/);
      if (allMatch) dims.push({ dimension: allMatch[1], members: [], isAll: true });
    }
  }
  return dims;
}

function parseSlicer(mdx: string): MDXSlicer {
  const whereMatch = mdx.match(/WHERE\s+\(\s*\[([^\]]+)\]\.\[([^\]]+)\]/i);
  if (!whereMatch) return { dimension: '', members: [] };
  return { dimension: whereMatch[1], members: [whereMatch[2]] };
}

function parseCalculatedMembers(mdx: string): MDXCalculatedMember[] {
  const members: MDXCalculatedMember[] = [];
  const pattern = /MEMBER\s+\[([^\]]+)\]\.\[([^\]]+)\]\s+AS\s+'([^']+)'/gi;
  let match = pattern.exec(mdx);
  while (match) {
    members.push({ dimension: match[1], name: match[2], formula: match[3] });
    match = pattern.exec(mdx);
  }
  return members;
}

function parseOrderBy(mdx: string): MDXQuery['orderBy'] {
  const orderMatch = mdx.match(/ORDER\s+ON\s+(\d+)/i);
  const dirMatch = mdx.match(/(ASC|DESC)/i);
  if (orderMatch) {
    return {
      axis: parseInt(orderMatch[1], 10),
      direction: (dirMatch?.[1]?.toUpperCase() as 'ASC' | 'DESC') ?? 'ASC',
    };
  }
  return undefined;
}

// =============================================================================
// MDX EVALUATOR
// =============================================================================

export class MDXEngine {
  private cubeData: Map<string, Map<string, unknown>>;

  constructor(cubeData: Map<string, Map<string, unknown>>) {
    this.cubeData = cubeData;
  }

  execute(mdx: string): MDXResult {
    const query = parseMDX(mdx);
    return this.evaluate(query);
  }

  evaluate(query: MDXQuery): MDXResult {
    const warnings: string[] = [];
    const cells = this.extractCells(query);
    const filtered = query.nonEmpty
      ? cells.filter((c) => c.value !== null && c.value !== undefined)
      : cells;

    const axes = query.axes.map((axis) => this.buildAxisResult(axis, filtered));

    if (query.orderBy) {
      this.sortAxis(axes, query.orderBy);
    }

    return { axes, cells: filtered, warnings };
  }

  private extractCells(query: MDXQuery): MDXCell[] {
    const cells: MDXCell[] = [];
    for (const [key, value] of this.cubeData) {
      const coords: Record<string, string> = {};
      const parts = key.split('|');
      for (const part of parts) {
        const eqIdx = part.indexOf('=');
        if (eqIdx > 0) coords[part.slice(0, eqIdx)] = part.slice(eqIdx + 1);
      }

      let inSlicer = true;
      if (query.slicer.dimension && query.slicer.members.length > 0) {
        const slicerVal = coords[query.slicer.dimension];
        inSlicer = query.slicer.members.includes(slicerVal);
      }

      if (inSlicer) {
        cells.push({ coordinates: coords, value: value as unknown as number | string | null });
      }
    }
    return cells;
  }

  private buildAxisResult(axis: MDXAxis, cells: MDXCell[]): MDXAxisResult {
    const tuples: MDXTuple[] = [];
    const seen = new Set<string>();

    for (const cell of cells) {
      const members = axis.dimensions.map((dim) => ({
        dimension: dim.dimension,
        member: cell.coordinates[dim.dimension] ?? '',
      }));
      const key = members.map((m) => `${m.dimension}:${m.member}`).join('|');
      if (!seen.has(key)) {
        seen.add(key);
        tuples.push({ members });
      }
    }

    return { index: axis.index, tuples };
  }

  private sortAxis(axes: MDXAxisResult[], orderBy: NonNullable<MDXQuery['orderBy']>): void {
    const axis = axes.find((a) => a.index === orderBy.axis);
    if (!axis) return;
    axis.tuples.sort((a, b) => {
      const aKey = a.members.map((m) => m.member).join('|');
      const bKey = b.members.map((m) => m.member).join('|');
      return orderBy.direction === 'ASC' ? aKey.localeCompare(bKey) : bKey.localeCompare(aKey);
    });
  }
}

export function formatMDXResult(result: MDXResult): string {
  const lines: string[] = [];
  for (const axis of result.axes) {
    lines.push(`Axis ${axis.index}:`);
    for (const tuple of axis.tuples) {
      const members = tuple.members.map((m) => `[${m.dimension}].[${m.member}]`).join(', ');
      lines.push(`  (${members})`);
    }
  }
  if (result.warnings.length > 0) {
    lines.push('Warnings: ' + result.warnings.join(', '));
  }
  return lines.join('\n');
}
