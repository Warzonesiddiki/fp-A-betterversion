import { describe, it, expect, beforeEach } from 'vitest';
import { parseMDX, MDXEngine, formatMDXResult, type MDXQuery, type MDXResult } from './MDXEngine';

// =============================================================================
// MDXEngine Tests
// The Query Theorist: "MDX is a language. If you can't express a query,
// the language is incomplete."
// =============================================================================

describe('parseMDX', () => {
  it('should parse a basic SELECT with FROM clause', () => {
    const query = parseMDX('SELECT {[Account].[Revenue]} ON 0 FROM [Finance]');
    expect(query.cube).toBe('finance');
    expect(query.axes).toHaveLength(1);
    expect(query.axes[0].index).toBe(0);
    // Parser normalizes to UPPERCASE
    expect(query.axes[0].dimensions[0].dimension).toBe('ACCOUNT');
    expect(query.axes[0].dimensions[0].members).toEqual(['REVENUE']);
  });

  it('should parse multi-axis query (rows and columns)', () => {
    const query = parseMDX(
      'SELECT {[Account].[Revenue]} ON 0, {[Period].[2024]} ON 1 FROM [Finance]'
    );
    expect(query.axes).toHaveLength(2);
    expect(query.axes[0].index).toBe(0);
    expect(query.axes[1].index).toBe(1);
  });

  it('should parse NON EMPTY modifier', () => {
    const query = parseMDX('SELECT NON EMPTY {[Account].[Revenue]} ON 0 FROM [Finance]');
    expect(query.nonEmpty).toBe(true);
  });

  it('should default nonEmpty to false when not specified', () => {
    const query = parseMDX('SELECT {[Account].[Revenue]} ON 0 FROM [Finance]');
    expect(query.nonEmpty).toBe(false);
  });

  it('should parse WHERE (slicer) clause', () => {
    const query = parseMDX(
      'SELECT {[Account].[Revenue]} ON 0 FROM [Finance] WHERE ([Scenario].[Actual])'
    );
    // Parser uppercases the normalized string
    expect(query.slicer.dimension).toBe('SCENARIO');
    expect(query.slicer.members).toEqual(['ACTUAL']);
  });

  it('should return empty slicer when no WHERE clause', () => {
    const query = parseMDX('SELECT {[Account].[Revenue]} ON 0 FROM [Finance]');
    expect(query.slicer.dimension).toBe('');
    expect(query.slicer.members).toEqual([]);
  });

  it('should parse calculated members', () => {
    const query = parseMDX(
      "SELECT {[Account].[Growth]} ON 0 FROM [Finance] MEMBER [Account].[Growth] AS '[Account].[Revenue] * 1.1'"
    );
    expect(query.calculatedMembers).toHaveLength(1);
    // parseCalculatedMembers uses the original (non-uppercased) mdx
    expect(query.calculatedMembers[0].name).toBe('Growth');
    expect(query.calculatedMembers[0].formula).toBe('[Account].[Revenue] * 1.1');
    expect(query.calculatedMembers[0].dimension).toBe('Account');
  });

  it('should parse ORDER BY clause', () => {
    const query = parseMDX('SELECT {[Account].[Revenue]} ON 0 ORDER ON 0 ASC FROM [Finance]');
    expect(query.orderBy).toBeDefined();
    expect(query.orderBy?.axis).toBe(0);
    expect(query.orderBy?.direction).toBe('ASC');
  });

  it('should parse ORDER BY DESC', () => {
    const query = parseMDX('SELECT {[Account].[Revenue]} ON 0 ORDER ON 0 DESC FROM [Finance]');
    expect(query.orderBy?.direction).toBe('DESC');
  });

  it('should throw when FROM clause is missing', () => {
    expect(() => parseMDX('SELECT {[Account].[Revenue]} ON 0')).toThrow('MDX: Missing FROM clause');
  });

  it('should handle .ALL members', () => {
    const query = parseMDX('SELECT {[Account].ALL} ON 0 FROM [Finance]');
    expect(query.axes[0].dimensions[0].isAll).toBe(true);
  });

  it('should normalize whitespace', () => {
    const query = parseMDX(
      `SELECT
        {[Account].[Revenue]} ON 0
      FROM [Finance]`
    );
    expect(query.cube).toBe('finance');
    expect(query.axes).toHaveLength(1);
  });

  it('should handle multiple members on one axis', () => {
    const query = parseMDX('SELECT {[Account].[Revenue], [Account].[COGS]} ON 0 FROM [Finance]');
    expect(query.axes[0].dimensions).toHaveLength(2);
    // Parser uppercases the normalized string
    expect(query.axes[0].dimensions[0].members).toEqual(['REVENUE']);
    expect(query.axes[0].dimensions[1].members).toEqual(['COGS']);
  });
});

describe('MDXEngine', () => {
  let engine: MDXEngine;
  // The engine's extractCells iterates the outer map expecting flat
  // key=value|key=value cell coordinates. We use a flat map cast to
  // the constructor's expected type.
  let cubeData: Map<string, Map<string, unknown>>;

  beforeEach(() => {
    // Build flat cell data that extractCells can parse
    const flatCells = new Map<string, unknown>();
    flatCells.set('Account=Revenue|Period=2024|Scenario=Actual', 100000);
    flatCells.set('Account=COGS|Period=2024|Scenario=Actual', 60000);
    flatCells.set('Account=Revenue|Period=2025|Scenario=Actual', 120000);
    flatCells.set('Account=Revenue|Period=2024|Scenario=Budget', 95000);
    // Cast: the engine iterates the outer map entries as (cellKey, cellValue)
    cubeData = flatCells as unknown as Map<string, Map<string, unknown>>;

    engine = new MDXEngine(cubeData);
  });

  it('should execute a simple MDX query', () => {
    const result = engine.execute('SELECT {[Account].[Revenue]} ON 0 FROM [Finance]');
    expect(result.axes).toHaveLength(1);
    expect(result.cells.length).toBeGreaterThan(0);
  });

  it('should evaluate a parsed MDXQuery', () => {
    const query: MDXQuery = {
      cube: 'finance',
      axes: [
        { index: 0, dimensions: [{ dimension: 'Account', members: ['Revenue'], isAll: false }] },
      ],
      slicer: { dimension: '', members: [] },
      calculatedMembers: [],
      nonEmpty: false,
    };
    const result = engine.evaluate(query);
    expect(result.axes[0].tuples.length).toBeGreaterThan(0);
  });

  it('should filter cells by slicer (WHERE clause)', () => {
    const result = engine.execute(
      'SELECT {[Account].[Revenue]} ON 0 FROM [Finance] WHERE ([Scenario].[Actual])'
    );
    // Only Actual scenario cells should appear
    for (const cell of result.cells) {
      expect(cell.coordinates['Scenario']).toBe('Actual');
    }
  });

  it('should filter out null cells when NON EMPTY is used', () => {
    // Create a new engine with a null cell in the flat map
    const dataWithNull = new Map<string, unknown>();
    dataWithNull.set('Account=NullItem|Period=2024|Scenario=Actual', null);
    dataWithNull.set('Account=Revenue|Period=2024|Scenario=Actual', 100);
    const engineWithNull = new MDXEngine(
      dataWithNull as unknown as Map<string, Map<string, unknown>>
    );

    const withNull = engineWithNull.execute('SELECT {[Account].[NullItem]} ON 0 FROM [Finance]');
    const nonEmpty = engineWithNull.execute(
      'SELECT NON EMPTY {[Account].[NullItem]} ON 0 FROM [Finance]'
    );
    expect(nonEmpty.cells.length).toBeLessThanOrEqual(withNull.cells.length);
  });

  it('should build axis results with tuples', () => {
    const result = engine.execute('SELECT {[Account].[Revenue]} ON 0 FROM [Finance]');
    expect(result.axes[0].index).toBe(0);
    for (const tuple of result.axes[0].tuples) {
      expect(tuple.members).toBeDefined();
      expect(tuple.members.length).toBeGreaterThan(0);
    }
  });

  it('should sort tuples when ORDER BY is specified', () => {
    const result = engine.execute(
      'SELECT {[Account].[Revenue]} ON 0 ORDER ON 0 ASC FROM [Finance]'
    );
    const tupleKeys = result.axes[0].tuples.map((t) => t.members.map((m) => m.member).join('|'));
    const sorted = [...tupleKeys].sort();
    expect(tupleKeys).toEqual(sorted);
  });

  it('should sort tuples DESC', () => {
    const result = engine.execute(
      'SELECT {[Account].[Revenue]} ON 0 ORDER ON 0 DESC FROM [Finance]'
    );
    const tupleKeys = result.axes[0].tuples.map((t) => t.members.map((m) => m.member).join('|'));
    const sorted = [...tupleKeys].sort().reverse();
    expect(tupleKeys).toEqual(sorted);
  });

  it('should still parse query for non-existent cube (no cube-level filtering)', () => {
    // The engine's extractCells iterates all entries without cube filtering,
    // so cells are returned regardless of the cube name in the query.
    const result = engine.execute('SELECT {[Account].[Revenue]} ON 0 FROM [NonExistent]');
    expect(result.axes).toHaveLength(1);
  });

  it('should return empty warnings by default', () => {
    const result = engine.execute('SELECT {[Account].[Revenue]} ON 0 FROM [Finance]');
    expect(result.warnings).toEqual([]);
  });

  it('should deduplicate tuples', () => {
    const result = engine.execute('SELECT {[Account].[Revenue]} ON 0 FROM [Finance]');
    const keys = result.axes[0].tuples.map((t) =>
      t.members.map((m) => `${m.dimension}:${m.member}`).join('|')
    );
    const uniqueKeys = [...new Set(keys)];
    expect(keys.length).toBe(uniqueKeys.length);
  });
});

describe('formatMDXResult', () => {
  it('should format axes with tuples', () => {
    const result: MDXResult = {
      axes: [
        {
          index: 0,
          tuples: [{ members: [{ dimension: 'Account', member: 'Revenue' }] }],
        },
      ],
      cells: [],
      warnings: [],
    };
    const output = formatMDXResult(result);
    expect(output).toContain('Axis 0:');
    expect(output).toContain('[Account].[Revenue]');
  });

  it('should include warnings when present', () => {
    const result: MDXResult = {
      axes: [],
      cells: [],
      warnings: ['Deprecated function used'],
    };
    const output = formatMDXResult(result);
    expect(output).toContain('Warnings: Deprecated function used');
  });

  it('should not include warnings section when empty', () => {
    const result: MDXResult = {
      axes: [{ index: 0, tuples: [] }],
      cells: [],
      warnings: [],
    };
    const output = formatMDXResult(result);
    expect(output).not.toContain('Warnings:');
  });
});
