# JavaScript and TypeScript

Rules for every `.js`, `.jsx`, `.mjs`, `.cjs`, `.ts`, `.tsx`, `.mts` and `.cts` file in this repository. Read this before writing, changing or reviewing any JavaScript or TypeScript code.

`@torque/lint-config` adjusts the Ultracite presets so Oxlint enforces these rules (`func-style`, `react/function-component-definition`, `no-param-reassign`, `typescript/consistent-type-assertions`, `import/no-default-export`). Lint and these rules must not disagree: when you change one, change the other. Two checks need type information and are not enforced yet: truthiness of numbers and strings (rule 2) and `readonly` parameter types (rule 6). Follow them by hand.

The examples use the planned domain (work orders, quotes, mechanics). They show the shape the code must have, not code that exists today.

## Contents

1. [Prefer `const`, use `let` only when needed, never `var`](#1-prefer-const-use-let-only-when-needed-never-var)
2. [Always compare explicitly with `===` and `!==`](#2-always-compare-explicitly-with--and-)
3. [Never use `any`](#3-never-use-any)
4. [Use named functions for components and methods](#4-use-named-functions-for-components-and-methods)
5. [Use the ternary operator only for simple decisions](#5-use-the-ternary-operator-only-for-simple-decisions)
6. [Treat parameters as immutable](#6-treat-parameters-as-immutable)
7. [Handle errors with useful messages](#7-handle-errors-with-useful-messages)
8. [Prefer named exports over default exports](#8-prefer-named-exports-over-default-exports)
9. [Checklist](#9-checklist)

## 1. Prefer `const`, use `let` only when needed, never `var`

- Declare every binding with `const` by default.
- Use `let` only when the binding is reassigned later. If you can rewrite the code so it is not reassigned (with an expression, an early return or a helper function), do that instead.
- Never use `var`: it is function-scoped and hoisted, which causes bugs that `const` and `let` prevent.

Do:

```ts
const MAX_OPEN_WORK_ORDERS = 5;

function totalInCents(items: readonly QuoteItem[]): number {
  let total = 0;

  for (const item of items) {
    total += item.priceInCents * item.quantity;
  }

  return total;
}
```

Better, when a single expression does the job and needs no `let`:

```ts
function totalInCents(items: readonly QuoteItem[]): number {
  return items.reduce(
    (sum, item) => sum + item.priceInCents * item.quantity,
    0
  );
}
```

Don't:

```ts
var maxOpenWorkOrders = 5; // var

let status = "open"; // never reassigned, must be const
let label; // reassigned only to pick a value, use an expression instead
if (workOrder.isUrgent) {
  label = "Urgent";
} else {
  label = "Normal";
}
```

## 2. Always compare explicitly with `===` and `!==`

- Use `===` and `!==` for every comparison. Never use `==` or `!=`: they coerce types (`0 == ""` is `true`).
- Check `null` and `undefined` explicitly, or with `??` and `?.` when that is the intent.
- Do not rely on truthiness for numbers and strings, where `0` and `""` are valid values. Compare against the value you mean.

Do:

```ts
if (workOrder.status === "done") {
  notifyCustomer(workOrder);
}

if (quote.discountInCents !== undefined) {
  applyDiscount(quote);
}

if (pendingItems.length === 0) {
  closeWorkOrder(workOrder);
}

const assignedMechanicName = workOrder.mechanic?.name ?? "Unassigned";
```

Don't:

```ts
if (workOrder.status == "done") {
} // loose equality
if (quote.discountInCents != null) {
} // loose inequality
if (!pendingItems.length) {
} // relies on 0 being falsy
if (!quote.discountInCents) {
} // a 0 discount is treated as "no discount"
```

## 3. Never use `any`

- Never write `any`, explicitly or implicitly (`strict` already reports implicit `any`).
- When the type is genuinely unknown (parsed JSON, `catch` errors, external input), use `unknown` and narrow it with a type guard or a Zod schema from `@torque/contracts`.
- Use generics when a function works for many types.
- Do not use `as` to silence the compiler. Narrow the type instead; use `as const` freely for literal types.

Do:

```ts
import { workOrderSchema, type WorkOrder } from "@torque/contracts";

function parseWorkOrder(payload: unknown): WorkOrder {
  return workOrderSchema.parse(payload);
}

function firstItem<T>(items: readonly T[]): T | undefined {
  return items[0];
}

const WORK_ORDER_STATUSES = ["open", "in_progress", "done"] as const;
type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number];

function isWorkOrderStatus(value: string): value is WorkOrderStatus {
  return WORK_ORDER_STATUSES.some((status) => status === value);
}
```

Don't:

```ts
function parseWorkOrder(payload: any) {
  // any
  return payload as WorkOrder; // assertion instead of validation
}

function firstItem(items: any[]): any {
  return items[0];
}
```

## 4. Use named functions for components and methods

- Define React components with a `function` declaration, not an arrow function assigned to a variable. The name shows up in stack traces and React DevTools, and the declaration reads as "this is a component".
- Define module-level functions, hooks, helpers and server actions with `function` declarations too.
- In classes and object literals, use method syntax (`start() {}`), not arrow functions stored in properties.
- Arrow functions stay the right choice for short inline callbacks (`map`, `filter`, event handlers passed inline, `reduce`).

Do:

```tsx
interface WorkOrderCardProps {
  readonly workOrder: WorkOrder;
}

export function WorkOrderCard({ workOrder }: WorkOrderCardProps) {
  return (
    <article>
      <h2>{workOrder.title}</h2>
      <ul>
        {workOrder.items.map((item) => (
          <li key={item.id}>{item.description}</li>
        ))}
      </ul>
    </article>
  );
}

export function useOpenWorkOrders(mechanicId: string) {
  // ...
}

export class WorkOrderService {
  constructor(private readonly repository: WorkOrderRepository) {}

  async assignMechanic(
    workOrderId: string,
    mechanicId: string
  ): Promise<WorkOrder> {
    // ...
  }
}

export const workOrderFormatter = {
  formatTotal(totalInCents: number): string {
    return `$${(totalInCents / 100).toFixed(2)}`;
  },
};
```

Don't:

```tsx
export const WorkOrderCard = ({ workOrder }: WorkOrderCardProps) => (
  // arrow component
  <article>{workOrder.title}</article>
);

export default function ({ workOrder }: WorkOrderCardProps) {
  // anonymous component
  return <article>{workOrder.title}</article>;
}

export class WorkOrderService {
  assignMechanic = async (workOrderId: string, mechanicId: string) => {
    // arrow method
    // ...
  };
}
```

## 5. Use the ternary operator only for simple decisions

- Use a ternary only to pick between two simple values or two short JSX branches.
- Never nest ternaries.
- When a branch has side effects, more than one condition or more than a short expression, use `if`/`else`, an early return, a lookup object or a `switch`.

Do:

```tsx
const badgeColor = workOrder.isUrgent ? "red" : "gray";

return <p>{workOrder.mechanic ? workOrder.mechanic.name : "Unassigned"}</p>;
```

For more than two outcomes, use a lookup object or a `switch`:

```ts
const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  done: "Done",
};

const statusLabel = STATUS_LABELS[workOrder.status];
```

```ts
function approvalFor(quote: Quote): Approval {
  if (quote.totalInCents > MANAGER_APPROVAL_LIMIT_IN_CENTS) {
    return "manager";
  }

  if (quote.totalInCents > ATTENDANT_APPROVAL_LIMIT_IN_CENTS) {
    return "attendant";
  }

  return "none";
}
```

Don't:

```ts
// nested ternary
const statusLabel =
  workOrder.status === "open"
    ? "Open"
    : workOrder.status === "in_progress"
      ? "In progress"
      : "Done";

// side effects in a ternary
workOrder.isUrgent ? notifyManager(workOrder) : queueForLater(workOrder);
```

## 6. Treat parameters as immutable

- Never reassign a parameter. Declare a new `const` instead.
- Never mutate an object or array you receive as a parameter (no property assignment, `push`, `splice`, `sort`, `reverse`, `delete`). Return a new value instead (spread, `map`, `filter`, `toSorted`, `toReversed`, `with`).
- Type object parameters with `readonly` properties or `Readonly<T>`, and array parameters as `readonly T[]`, so the compiler blocks mutation.

Do:

```ts
function assignMechanic(
  workOrder: Readonly<WorkOrder>,
  mechanicId: string
): WorkOrder {
  return { ...workOrder, mechanicId, status: "in_progress" };
}

function sortByCreatedAt(workOrders: readonly WorkOrder[]): WorkOrder[] {
  return workOrders.toSorted(
    (first, second) => first.createdAt.getTime() - second.createdAt.getTime()
  );
}

function normalizePlate(plate: string): string {
  const normalizedPlate = plate.trim().toUpperCase();

  return normalizedPlate;
}
```

Don't:

```ts
function assignMechanic(workOrder: WorkOrder, mechanicId: string): WorkOrder {
  workOrder.mechanicId = mechanicId; // mutates the caller's object
  workOrder.status = "in_progress";
  return workOrder;
}

function sortByCreatedAt(workOrders: WorkOrder[]): WorkOrder[] {
  return workOrders.sort(
    (first, second) => first.createdAt.getTime() - second.createdAt.getTime()
  ); // sorts in place
}

function normalizePlate(plate: string): string {
  plate = plate.trim().toUpperCase(); // reassigns the parameter
  return plate;
}
```

## 7. Handle errors with useful messages

- Throw `Error` objects (or subclasses), never strings or plain objects.
- Write messages that say what failed and include the identifiers needed to debug it (ids, statuses, limits). Never include secrets, passwords or tokens.
- When you catch an error and throw a new one, pass the original as `cause` so the stack is kept.
- Use a domain error class when callers need to tell errors apart (for example, to map them to HTTP status codes in the API).
- Catch an error only when you can handle it: recover, add context, or turn it into a response. Do not catch just to rethrow it unchanged, and never swallow it with an empty `catch`.
- `catch` receives `unknown`; narrow it before reading properties.

Do:

```ts
export class WorkOrderNotFoundError extends Error {
  constructor(readonly workOrderId: string) {
    super(`Work order "${workOrderId}" was not found.`);
    this.name = "WorkOrderNotFoundError";
  }
}

export class InvalidStatusTransitionError extends Error {
  constructor(
    readonly from: WorkOrderStatus,
    readonly to: WorkOrderStatus
  ) {
    super(`Cannot move a work order from "${from}" to "${to}".`);
    this.name = "InvalidStatusTransitionError";
  }
}

async function loadWorkOrder(workOrderId: string): Promise<WorkOrder> {
  try {
    return await repository.findById(workOrderId);
  } catch (error: unknown) {
    throw new Error(
      `Failed to load work order "${workOrderId}" from the database.`,
      { cause: error }
    );
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
```

Don't:

```ts
throw "not found"; // a string, no stack trace
throw new Error("Error"); // says nothing about what failed
throw new Error(`Login failed for ${email} with password ${password}`); // leaks a secret

try {
  await repository.findById(workOrderId);
} catch {
  // swallowed: the caller never learns it failed
}

try {
  await repository.findById(workOrderId);
} catch (error) {
  throw error; // catch only to rethrow, adds nothing
}

try {
  await repository.findById(workOrderId);
} catch (error) {
  throw new Error("Failed to load work order"); // drops the original error, no cause
}
```

## 8. Prefer named exports over default exports

- Export everything with named exports. They keep one name across the codebase, make renames safe and work better with auto-imports.
- Use a default export only where a framework or tool requires it:
  - Next.js App Router files: `page.tsx`, `layout.tsx`, `template.tsx`, `loading.tsx`, `error.tsx`, `global-error.tsx`, `not-found.tsx`, `forbidden.tsx`, `unauthorized.tsx` and `default.tsx`, plus the metadata files (`icon`, `apple-icon`, `opengraph-image`, `twitter-image`, `sitemap`, `robots`, `manifest`).
  - Config files that the tool loads by default export: `next.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `oxlint.config.ts`, `oxfmt.config.ts` and similar (any `*.config.*` file). Re-export a named config as the default (`export { nextConfig as default } from "@torque/lint-config/oxlint/next";`).
- Even in those files, name the default-exported function (see [rule 4](#4-use-named-functions-for-components-and-methods)).
- Route handlers (`route.ts`) and `generateMetadata` / `metadata` use named exports, as Next.js expects.

Do:

```tsx
// packages/ui/src/button.tsx
export function Button({ children }: ButtonProps) {
  return <button type="button">{children}</button>;
}

// apps/web/app/work-orders/page.tsx: Next.js requires a default export
import { WorkOrderList } from "../../components/work-order-list";

export const metadata = { title: "Work orders" };

export default function WorkOrdersPage() {
  return <WorkOrderList />;
}

// apps/web/app/api/work-orders/route.ts: route handlers are named exports
export async function GET() {
  // ...
}
```

Don't:

```tsx
// packages/ui/src/button.tsx
export default function Button({ children }: ButtonProps) {
  // default export outside a framework file
  return <button type="button">{children}</button>;
}

// apps/web/app/work-orders/page.tsx
export default function () {
  // anonymous default export
  return <WorkOrderList />;
}
```

## 9. Checklist

Before finishing a change:

- [ ] No `var`, and every `let` is reassigned.
- [ ] Every comparison uses `===` or `!==`, and numbers and strings are not checked by truthiness.
- [ ] No `any`; unknown values are `unknown` and narrowed, and no `as` silences the compiler.
- [ ] Components, hooks, helpers and methods are named `function` declarations or method syntax.
- [ ] Ternaries are simple and never nested.
- [ ] No parameter is reassigned or mutated, and object and array parameters are `readonly`.
- [ ] Every thrown value is an `Error` with a message that says what failed, with `cause` when wrapping.
- [ ] Only framework or tool files use default exports, and every default export is named.
