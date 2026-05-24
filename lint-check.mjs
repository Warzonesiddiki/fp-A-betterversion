import { ESLint } from "eslint";
import tseslint from "typescript-eslint";

const eslint = new ESLint({
  overrideConfigFile: true,
  overrideConfig: [
    ...tseslint.configs.recommended,
    {
      files: ["**/*.{ts,tsx}"],
      rules: {
        "@typescript-eslint/no-unused-expressions": "error"
      }
    }
  ]
});

const results = await eslint.lintFiles(["src/**/*.{ts,tsx}"]);
const formatter = await eslint.loadFormatter("stylish");
const resultText = formatter.format(results);

if (resultText) {
  console.log(resultText);
} else {
  console.log("(no errors found)");
}

const errorCount = results.reduce((sum, r) => sum + r.errorCount, 0);
console.log("\nTotal errors:", errorCount);
