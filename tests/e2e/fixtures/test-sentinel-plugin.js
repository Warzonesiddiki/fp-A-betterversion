/**
 * Test plugin for E2E sandbox isolation testing.
 * This file is bundled with the test fixture (test-sentinel-plugin.json).
 * It exercises:
 *   - Happy path: a benign function that returns a value
 *   - Isolation attempt: tries to access forbidden APIs (must be blocked)
 */

(function (api) {
  // Happy path: returns a constant
  api.register('hello', function () {
    return 'hello from sentinel-test-plugin';
  });

  // Compute: takes args, returns result
  api.register('add', function (a, b) {
    return Number(a) + Number(b);
  });

  // Read budgets: uses allowed permission
  api.register('listBudgets', function () {
    if (api && api.store && api.store.budgets) {
      return Object.keys(api.store.budgets).length;
    }
    return 0;
  });
})(api);
