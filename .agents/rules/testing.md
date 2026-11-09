# Testing

Rules for every test in this repository. Read this before writing, changing or reviewing code: every change ships with tests that follow these rules.

The examples use the planned domain (work orders, quotes, mechanics) and planned module names such as `@torque/domain` and `buildApp`. They show the shape a test must have, not code that exists today.

## Contents

1. [Tooling: Vitest and Playwright](#1-tooling-vitest-and-playwright)
2. [Every piece of code is covered by a test](#2-every-piece-of-code-is-covered-by-a-test)
3. [Follow the test pyramid](#3-follow-the-test-pyramid)
4. [Structure every test as Arrange/Act/Assert (Given/When/Then)](#4-structure-every-test-as-arrangeactassert-givenwhenthen)
5. [Tests are independent](#5-tests-are-independent)
6. [Follow the FIRST principles](#6-follow-the-first-principles)
7. [Checklist](#7-checklist)

## 1. Tooling: Vitest and Playwright

- **Vitest** runs unit and integration tests in every workspace.
- **Playwright** runs end-to-end (e2e) tests against the running web app and API.
- Do not add Jest, Mocha, Cypress or any other test runner.

File naming and location:

| Kind | Runner | File pattern | Location |
| --- | --- | --- | --- |
| Unit | Vitest | `*.test.ts` / `*.test.tsx` | Next to the file under test |
| Integration | Vitest | `*.integration.test.ts` | Next to the file under test |
| E2E | Playwright | `*.spec.ts` | `apps/web/e2e/` |

Workspace scripts:

- `test`: runs the Vitest unit and integration projects with coverage (`vitest run --coverage`). `pnpm test` at the root runs it in every workspace through Turborepo.
- `test:e2e`: runs Playwright (`playwright test`), only in `apps/web`.

Example `vitest.config.ts` for a workspace:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Undo spies, stubbed env vars and stubbed globals after every test.
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/**/*.d.ts"],
      // Fail the run when any file drops below 100% lines, branches, functions or statements.
      thresholds: { 100: true },
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.{ts,tsx}"],
          exclude: ["src/**/*.integration.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["src/**/*.integration.test.ts"],
          // Integration tests share one Postgres and one Redis, so files run one at a time.
          fileParallelism: false,
        },
      },
    ],
  },
});
```

Example `apps/web/playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  // A flaky test is a bug to fix, not something to retry away.
  retries: 0,
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

## 2. Every piece of code is covered by a test

- Every new or changed function, branch, route, component and page is covered by a test in the same change. Code without a test is not done.
- Coverage thresholds are 100% for lines, branches, functions and statements (`thresholds: { 100: true }`). A run below the threshold fails, and so does the change.
- A bug fix starts with a test that reproduces the bug and fails, then the fix makes it pass.
- Cover behavior, not just lines: test every branch, every error path and the boundary values of every rule.
- Only files without runtime logic may be left out of coverage, and only through `coverage.exclude`: type-only files, generated code (for example the Prisma client) and migrations. Config files outside `src/` are not measured.
- Do not use `/* v8 ignore */` comments. The one exception is the unreachable `never` branch of an exhaustive `switch`, with a comment saying why.

Example: a rule with two branches needs a test for each branch and for the boundary.

```ts
// packages/domain/src/quote/discount.ts
const LOYALTY_DISCOUNT_RATE = 0.1;
const LOYALTY_MIN_COMPLETED_ORDERS = 5;

export function calculateLoyaltyDiscount(
  totalInCents: number,
  completedOrders: number
): number {
  if (completedOrders < LOYALTY_MIN_COMPLETED_ORDERS) {
    return 0;
  }
  return Math.round(totalInCents * LOYALTY_DISCOUNT_RATE);
}
```

```ts
// packages/domain/src/quote/discount.test.ts
import { describe, expect, it } from "vitest";

import { calculateLoyaltyDiscount } from "./discount";

describe("calculateLoyaltyDiscount", () => {
  it.each([
    { completedOrders: 0, expected: 0 },
    { completedOrders: 4, expected: 0 }, // just below the boundary
    { completedOrders: 5, expected: 1000 }, // on the boundary
    { completedOrders: 12, expected: 1000 },
  ])(
    "returns $expected cents for $completedOrders completed orders",
    ({ completedOrders, expected }) => {
      const totalInCents = 10_000;

      const discount = calculateLoyaltyDiscount(totalInCents, completedOrders);

      expect(discount).toBe(expected);
    }
  );
});
```

Example: a bug fix starts with a failing regression test that names the bug.

```ts
it("does not apply the loyalty discount twice when the quote is recalculated (#42)", () => {
  const quote = buildQuote({ totalInCents: 10_000, completedOrders: 5 });

  const recalculated = recalculateQuote(recalculateQuote(quote));

  expect(recalculated.discountInCents).toBe(1000);
});
```

## 3. Follow the test pyramid

Many fast unit tests at the base, fewer integration tests in the middle, a few e2e tests at the top. Test each behavior at the lowest level that can catch its bug, and do not repeat at a higher level what a lower level already proves.

| Level | Share | What it tests | Examples in Torque |
| --- | --- | --- | --- |
| Unit | Most | One function, class or component in isolation. No network, database, Redis or file system. | Pricing and discount rules, work order state transitions, Zod schemas |
| Integration | Some | Several pieces together with real infrastructure: Fastify routes with Postgres and Redis. | Routes, auth and roles, pagination, caching, locks under concurrency |
| E2E | Fewest | A complete user journey in a real browser against the running web app and API. | A customer approves a quote, a mechanic finishes a work order |

- `packages/domain` and `packages/contracts`: unit tests only.
- `packages/db` and `packages/redis`: integration tests against the Docker Compose Postgres and Redis.
- `apps/api`: integration tests through `app.inject()` for every route, unit tests for helpers.
- `apps/web`: unit tests for components and hooks, e2e tests only for critical journeys.

Example (unit): a domain rule, no I/O.

```ts
// packages/domain/src/work-order/transition.test.ts
import { expect, it } from "vitest";

import { transitionWorkOrder } from "./transition";

it("rejects finishing a work order that was never started", () => {
  const workOrder = buildWorkOrder({ status: "pending" });

  const result = transitionWorkOrder(workOrder, "finished");

  expect(result).toEqual({ ok: false, error: "INVALID_TRANSITION" });
});
```

Example (integration): a route with real Postgres and Redis, testing a race that a unit test cannot catch.

```ts
// apps/api/src/work-orders/claim.integration.test.ts
import { afterAll, beforeEach, expect, it } from "vitest";

import { createWorkOrder, resetDatabase } from "../../test/helpers";
import { buildApp } from "../app";

const app = await buildApp();

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await app.close();
});

it("lets only one of two mechanics claim the same work order at the same time", async () => {
  const workOrder = await createWorkOrder({ status: "pending" });
  const claim = (mechanicId: string) =>
    app.inject({
      method: "POST",
      url: `/work-orders/${workOrder.id}/claim`,
      payload: { mechanicId },
    });

  const responses = await Promise.all([
    claim("mechanic-1"),
    claim("mechanic-2"),
  ]);

  const statusCodes = responses
    .map((response) => response.statusCode)
    .toSorted();
  expect(statusCodes).toEqual([200, 409]);
});
```

Example (e2e): one critical journey. The discount and status rules behind it are already proven by unit and integration tests, so this test only checks that the pieces are wired together.

```ts
// apps/web/e2e/approve-quote.spec.ts
import { expect, test } from "@playwright/test";

import { createPendingQuote, signInAsCustomer } from "./helpers";

test("customer approves a pending quote", async ({ page, request }) => {
  const quote = await createPendingQuote(request);
  await signInAsCustomer(page, quote.customerId);
  await page.goto(`/quotes/${quote.id}`);

  await page.getByRole("button", { name: "Approve quote" }).click();

  await expect(page.getByRole("status")).toHaveText("Quote approved");
});
```

Bad: an e2e test for every discount boundary. Those belong in the unit test of `calculateLoyaltyDiscount`.

## 4. Structure every test as Arrange/Act/Assert (Given/When/Then)

Every test has three parts, in this order, separated by a blank line:

1. **Arrange (Given)**: build the state and inputs the test needs.
2. **Act (When)**: run the one behavior under test. Usually a single call.
3. **Assert (Then)**: check the outcome.

- One behavior per test. If a test needs two Act steps, split it into two tests.
- Do not put assertions inside Arrange or Act, and do not act again after asserting.
- Name the test after the behavior and the condition, so the name reads as the Given/When/Then sentence: `"rejects finishing a work order that was never started"`, or `"given a started work order, when it is finished, then it records the finish time"`.
- Add `// Arrange` / `// Act` / `// Assert` (or `// Given` / `// When` / `// Then`) comments when a part spans several lines or the split is not obvious. A short test separated by blank lines needs no comments.

Example (AAA):

```ts
it("records the finish time when a started work order is finished", () => {
  // Arrange
  const startedAt = new Date("2026-03-10T09:00:00Z");
  const finishedAt = new Date("2026-03-10T11:30:00Z");
  const workOrder = buildWorkOrder({ status: "in_progress", startedAt });

  // Act
  const result = transitionWorkOrder(workOrder, "finished", {
    now: finishedAt,
  });

  // Assert
  expect(result).toEqual({
    ok: true,
    workOrder: expect.objectContaining({ status: "finished", finishedAt }),
  });
});
```

Example (Given/When/Then, Playwright):

```ts
test("given a finished work order, when the attendant opens it, then the invoice button is enabled", async ({
  page,
  request,
}) => {
  // Given
  const workOrder = await createFinishedWorkOrder(request);
  await signInAsAttendant(page);

  // When
  await page.goto(`/work-orders/${workOrder.id}`);

  // Then
  await expect(
    page.getByRole("button", { name: "Create invoice" })
  ).toBeEnabled();
});
```

Bad: two behaviors and mixed parts in one test.

```ts
it("handles work orders", () => {
  const workOrder = buildWorkOrder({ status: "pending" });
  const started = transitionWorkOrder(workOrder, "in_progress");
  expect(started.ok).toBe(true); // asserting in the middle
  const finished = transitionWorkOrder(started.workOrder, "finished"); // second Act
  expect(finished.ok).toBe(true);
});
```

## 5. Tests are independent

Every test passes or fails on its own: alone, in any order, in parallel and repeated. No test depends on another test, on leftovers from another test, or on the order of the file.

- Each test creates the data it needs, through factories (`buildWorkOrder` for in-memory objects, `createWorkOrder` for database rows) with overrides for only the fields that matter.
- No shared mutable state between tests: no `let` at the top of the file that one test writes and another reads.
- Reset shared infrastructure before each test (for example `resetDatabase()` in `beforeEach` for integration tests), and do not rely on seed data.
- Mocks, spies, fake timers and stubbed env vars are undone after each test (`restoreMocks`, `unstubEnvs` and `unstubGlobals` in the Vitest config, `vi.useRealTimers()` in `afterEach`).
- In Playwright, each test gets its own browser context (the default) and signs in and creates data on its own. Do not use `test.describe.serial`.
- Never commit `.only` or `.skip`.

Bad: the second test only passes when the first one runs before it.

```ts
let workOrder: WorkOrder;

it("creates a work order", () => {
  workOrder = createWorkOrderDraft({ customerId: "customer-1" });

  expect(workOrder.status).toBe("pending");
});

it("assigns a mechanic", () => {
  const result = assignMechanic(workOrder, "mechanic-1"); // breaks when run alone

  expect(result.workOrder.mechanicId).toBe("mechanic-1");
});
```

Good: each test builds its own state.

```ts
it("creates a pending work order", () => {
  const workOrder = createWorkOrderDraft({ customerId: "customer-1" });

  expect(workOrder.status).toBe("pending");
});

it("assigns a mechanic to a pending work order", () => {
  const workOrder = buildWorkOrder({ status: "pending" });

  const result = assignMechanic(workOrder, "mechanic-1");

  expect(result.workOrder.mechanicId).toBe("mechanic-1");
});
```

Example factory with overrides:

```ts
// packages/domain/test/factories.ts
import type { WorkOrder } from "../src/work-order/types";

export function buildWorkOrder(overrides: Partial<WorkOrder> = {}): WorkOrder {
  return {
    id: crypto.randomUUID(),
    customerId: "customer-1",
    mechanicId: null,
    status: "pending",
    startedAt: null,
    finishedAt: null,
    ...overrides,
  };
}
```

## 6. Follow the FIRST principles

### Fast

Tests run in milliseconds so they can run on every change. Unit tests do no I/O. Integration tests use the local Docker Postgres and Redis, never remote services. No fixed waits.

Bad:

```ts
it("expires the quote after its validity period", async () => {
  const quote = buildQuote({ validForMs: 2000 });

  await new Promise((resolve) => setTimeout(resolve, 2100)); // slow and timing-dependent

  expect(isQuoteExpired(quote, new Date())).toBe(true);
});
```

Good: pass the time in.

```ts
it("expires the quote after its validity period", () => {
  const createdAt = new Date("2026-03-10T09:00:00Z");
  const quote = buildQuote({ createdAt, validForMs: 2000 });
  const now = new Date("2026-03-10T09:00:02.100Z");

  const expired = isQuoteExpired(quote, now);

  expect(expired).toBe(true);
});
```

In Playwright, wait on web-first assertions, never on `page.waitForTimeout()`:

```ts
await expect(page.getByRole("status")).toHaveText("Quote approved");
```

### Independent

See [rule 5](#5-tests-are-independent).

### Repeatable

Same result on every run, on every machine, at any time of day. No dependence on the real clock, random values, time zone, locale, network or external APIs.

- Domain functions take the current time as a parameter (`now`). Where code reads the clock itself, use `vi.useFakeTimers()` and `vi.setSystemTime()`.
- Fix random values: pass IDs in or stub the generator.
- Stub third-party HTTP services at the boundary (for example with `vi.spyOn` on the client). Do not stub Postgres or Redis in integration tests: use the real ones.

Example:

```ts
import { afterEach, beforeEach, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-03-10T09:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

it("stamps a new work order with the current time", () => {
  const workOrder = createWorkOrderDraft({ customerId: "customer-1" });

  expect(workOrder.createdAt).toEqual(new Date("2026-03-10T09:00:00Z"));
});
```

### Self-validating

A test passes or fails through its assertions alone. Nobody reads logs or output to decide. Every test has at least one `expect`, and the assertion is specific.

Bad:

```ts
it("calculates the quote total", () => {
  const total = calculateQuoteTotal(buildQuote());

  console.log(total); // someone has to read this
});
```

Bad: an assertion that passes for almost any result.

```ts
expect(total).toBeDefined();
```

Good:

```ts
it("adds parts and labor into the quote total", () => {
  const quote = buildQuote({ partsInCents: 15_000, laborInCents: 8000 });

  const total = calculateQuoteTotal(quote);

  expect(total).toBe(23_000);
});
```

For errors, assert the specific error:

```ts
expect(() => parseWorkOrderStatus("unknown")).toThrow(
  'Unknown work order status: "unknown"'
);
```

### Timely

Write the test with the code, in the same change, and preferably before it (red, green, refactor). Do not open a pull request that says "tests in a follow-up".

Example sequence for a new rule "a quote above 5,000.00 needs manager approval":

1. Write the failing test:

   ```ts
   it("requires manager approval for quotes above 500,000 cents", () => {
     const quote = buildQuote({ totalInCents: 500_001 });

     const approval = requiredApproval(quote);

     expect(approval).toBe("manager");
   });
   ```

2. Run it and watch it fail (`requiredApproval` does not exist yet).
3. Write the smallest `requiredApproval` that makes it pass.
4. Add the boundary tests (`500_000` and below needs no manager approval), then refactor with all tests green.

## 7. Checklist

Before finishing a change:

- [ ] Every new or changed behavior has a test at the lowest pyramid level that can catch its bug.
- [ ] `pnpm test` passes with 100% coverage, and `pnpm --filter web test:e2e` passes when a user journey changed.
- [ ] Every test follows Arrange/Act/Assert (Given/When/Then) and tests one behavior.
- [ ] Every test passes alone and in any order, and creates its own data.
- [ ] No real clock, randomness, fixed waits or external network in tests.
- [ ] Every test has specific assertions, and no `.only`, `.skip` or `console.log` is committed.
- [ ] A bug fix includes a regression test that failed before the fix.
