import { FormulaEngine } from './src/engines/FormulaEngine';

const mockGetCellValue = (ref: string): number => {
    const values: Record<string, number> = {
        'A1': 100,
        'A2': 200,
        'B1': 300,
        'B2': 400,
        'C1': 0.1, // Rate for NPV
        'D1': -1000, // Initial investment
        'D2': 500,
        'D3': 600,
        'D4': 700,
    };
    return values[ref] || 0;
};

function test(formula: string) {
    const parseResult = FormulaEngine.parseFormula(formula);
    if (!parseResult.valid) {
        console.log(`Formula: ${formula} - Parse Error: ${parseResult.error}`);
        return;
    }
    const evalResult = FormulaEngine.evaluate(parseResult.nodes, mockGetCellValue);
    console.log(`Formula: ${formula} - Value: ${evalResult.value} - Error: ${evalResult.error} - Deps: ${evalResult.dependencies.join(', ')}`);
}

console.log("Testing current functionality...");
test("=A1+A2");
test("=SUM(A1:A2)");
test("=IF(A1>50, B1, B2)");
test("=NPV(C1, D2, D3, D4)");
test("=CAGR(1000, 500, 3)");

console.log("\nTesting 2D range (Expected to be limited/fail currently)...");
test("=SUM(A1:B2)");

console.log("\nTesting nested IF...");
test("=IF(A1>200, 1, IF(A1>50, 2, 3))");

console.log("\nTesting financial functions (XIRR, IRR - Expected to fail/be 0 currently)...");
test("=IRR(D1, D2, D3, D4)");
test("=XIRR(D1, D2, D3, D4)");
