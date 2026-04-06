# Testing instructions

General guidelines and patterns for writing tests in this codebase, including unit tests with Vitest and end-to-end tests with Playwright. This file covers test structure, mocking strategy, and best practices to ensure reliable and maintainable tests.

## Test File Organization
**Unit tests:** Located in `src/**/*.test.ts`, co-located with the source files they test. Follow the pattern of importing the component/module, mocking necessary dependencies, and using Testing Library for assertions. Setups and mocks can be placed in `src/tests/setup.ts` and `src/tests/mocks/` respectively.
**E2E tests:** Located in the `e2e/` directory, organized by feature. Use Playwright's test runner with separate contexts for different user roles. Authenticated contexts can be set up using storage state files generated from authentication setup scripts in `e2e/setup/auth-*.setup.ts`.

## Test Structure
**Unit tests:** Use Vitest's `describe`, `it`, and `expect` for structuring tests. Mock SvelteKit modules and project-specific modules as needed to isolate the component under test. Always clean up rendered components between tests to prevent state leakage.
**E2E tests:** Use Playwright's `test` function to define test cases. Leverage `test.use()` to set up authenticated contexts. Use Playwright's powerful selectors and assertions to interact with the application and verify expected outcomes. Consider waiting for specific elements to appear after actions that trigger data reloads to ensure tests are reliable and not flaky.

## Test Best Practices
- Always mock external dependencies and SvelteKit modules to isolate the unit under test.
- Use Gherkin-style test names for E2E tests to clearly describe the user scenario being tested (e.g. "Given ... When ... Then ...").
- Always use data-testid attributes for selecting elements in tests to avoid brittle selectors based on text content or structure.
- For E2E tests, prefer waiting for specific elements that indicate the expected state of the application after an action, rather than relying on success messages or timing-based waits. This leads to more reliable tests that are less prone to flakiness.
- Keep test files organized by feature and user role to improve maintainability and clarity of test coverage.
- REUSE as much functions and utilities as possible between tests to avoid duplication and ensure consistency in test setup and assertions.
- When implementing new features, consider writing tests for the files that are being modified or added to ensure proper coverage and prevent regressions.


