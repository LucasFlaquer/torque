<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": true` in the root `turbo.json` or `turbo.jsonc` to opt in; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->

# AGENTS.md

Guidance for AI coding agents working in this repository.

## What this is

Torque is a mechanic shop management app built to practice fullstack development: data listing, pagination, caching and business rules under concurrency. Roles: `customer`, `attendant`, `mechanic`, `manager`.

Current status: Turborepo scaffold. The Next.js web app has the starter page; `apps/api` and the `contracts`, `db`, `redis` and `domain` packages are empty placeholders. Docker Compose runs Postgres and Redis.

## Prerequisites

- Node.js `>=24` (developed with v24.15.0; enforced by `engines` in the root `package.json`)
- pnpm `11.25.0` (pinned through `packageManager` in the root `package.json`; use Corepack or a matching global install)

## Install

```sh
pnpm install
cp .env.example .env
docker compose up -d --wait   # Postgres and Redis, both with healthchecks
```

If port 5432 or 6379 is taken on the host, set `POSTGRES_PORT` / `REDIS_PORT` in `.env` (and update `DATABASE_URL` / `REDIS_URL` to match).

## Root scripts

Run these from the repository root. Each one (except `format`, `check` and `fix`) runs a Turborepo task across all workspaces.

| Command | What it does |
| --- | --- |
| `pnpm dev` | `turbo run dev`: starts every app in dev mode (web on http://localhost:3000) |
| `pnpm build` | `turbo run build`: production build of every app and package |
| `pnpm lint` | `turbo run lint`: Oxlint with `--max-warnings 0` in every workspace |
| `pnpm check-types` | `turbo run check-types`: type-check (`tsc --noEmit`; the web app runs `next typegen` first) |
| `pnpm test` | `turbo run test`: tests in every workspace that has a `test` script (none yet) |
| `pnpm format:check` | `turbo run format:check`: Oxfmt `--check` in every workspace |
| `pnpm format` | Oxfmt `--write` over the whole repository |
| `pnpm check` | `ultracite check`: Oxlint + Oxfmt check over the whole repository |
| `pnpm fix` | `ultracite fix`: apply lint fixes and formatting over the whole repository |

Linting and formatting use [Ultracite](https://www.ultracite.ai) (Oxlint + Oxfmt). The config lives in `@torque/lint-config`; every workspace (and the root) has its own `oxlint.config.ts` and `oxfmt.config.ts` (`.mts` where `package.json` has no `"type": "module"`) that re-export the matching named config from that package as the default (`export { baseConfig as default } from "@torque/lint-config/oxlint/base";`), because Oxlint and Oxfmt use the nearest config file. A new workspace needs both files plus `@torque/lint-config`, `oxlint` and `oxfmt` in its `devDependencies`. The shared configs are TypeScript, loaded through Node's type stripping, and adjust the Ultracite presets to match `.agents/rules/typescript.md`; keep the two in sync.

Run a task for a single workspace with a filter:

```sh
pnpm exec turbo run build --filter=web
pnpm --filter web dev
pnpm --filter @torque/ui lint
```

Before finishing a change, `pnpm build`, `pnpm check` and `pnpm check-types` must pass.

## Workspace layout

```
apps/
  web/                    Next.js (App Router) web app, package name `web`
  api/                    Fastify API, package name `api` (only package.json so far)
packages/
  contracts/              @torque/contracts: Zod schemas and request/response types (placeholder)
  db/                     @torque/db: Prisma schema, client, migrations, seed (placeholder)
  redis/                  @torque/redis: Redis client, keys, cache, lock and pub/sub helpers (placeholder)
  domain/                 @torque/domain: pure business rules, no Prisma/Redis/Fastify imports (placeholder)
  ui/                     @torque/ui: shared React components (exports ./src/*.tsx)
  lint-config/            @torque/lint-config: Oxlint configs (oxlint/base, oxlint/react, oxlint/next) and Oxfmt config (oxfmt) on Ultracite presets
  typescript-config/      @torque/typescript-config: shared tsconfig bases (base, nextjs, react-library)
docker-compose.yml        Postgres 18 and Redis 8 with healthchecks and named volumes
.env.example              Environment variables template (copy to .env)
turbo.json                Turborepo task pipeline
pnpm-workspace.yaml       Workspace globs (apps/*, packages/*)
```

## Conventions

- English everywhere: code, comments, commit messages, docs, issues and PRs.
- Commit messages follow Conventional Commits (`feat`, `fix`, `refactor`, `docs`, `chore`, ...). The `commit` skill in `.agents/skills/commit/SKILL.md` holds the full format, scopes and examples; use it to commit.
- TypeScript in strict mode (`strict`, `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` are on in `@torque/typescript-config/base.json`).
- Internal packages use the `@torque/*` scope and are referenced with `workspace:*`.
- Use `pnpm --filter <workspace>` to add dependencies or run scripts in one workspace; do not `cd` into packages and use another package manager.
- Run Turborepo tasks from the repository root so caching and task dependencies apply.
- Do not commit `node_modules`, `.turbo`, `.next` or `.env*` files (already in `.gitignore`).
- This file (`AGENTS.md`) is the single source of agent instructions; the root `CLAUDE.md` only imports it with `@AGENTS.md`, so edit this file instead. It holds a block managed by `turbo`, and `apps/web/AGENTS.md` / `apps/web/CLAUDE.md` are generated by `next dev`. They point to the version-matched docs bundled in `node_modules/turbo` and `node_modules/next`; read those docs before changing Turborepo or Next.js config. Keep these files committed and do not edit the managed blocks by hand.

## Rules

Detailed rules live in `.agents/rules/`. Read the matching rule before working in its area; it overrides general guidance in this file.

| Rule | Read before |
| --- | --- |
| [Testing](.agents/rules/testing.md) | Writing, changing or reviewing any code or test: Vitest for unit and integration tests, Playwright for e2e, test pyramid, AAA / Given-When-Then, independence, FIRST, 100% coverage |
| [JavaScript and TypeScript](.agents/rules/typescript.md) | Writing, changing or reviewing any `.js`/`.ts`/`.jsx`/`.tsx` file: `const` over `let`, no `var`, `===` only, no `any`, named functions for components and methods, simple ternaries, immutable parameters, useful error messages, named exports (default only for Next.js files and tool configs) |

## Planned architecture

Not built yet; this lands in Sprint 1.

- `apps/web`: Next.js App Router frontend.
- `apps/api`: Fastify API.
- `packages/contracts`: Zod schemas shared by web and API.
- `packages/db`: PostgreSQL + Prisma.
- `packages/redis`: Redis client and caching helpers.
- `packages/domain`: pure business rules.
- `packages/config`: shared configuration.

Specs and tasks live as issues in the GitHub Project for this repository. Check the relevant issue before implementing a feature.

# Ultracite Code Standards

This project uses **Ultracite**, a zero-config preset that enforces strict code quality standards through automated formatting and linting.

## Quick Reference

- **Format code**: `pnpm exec ultracite fix`
- **Check for issues**: `pnpm exec ultracite check`
- **Diagnose setup**: `pnpm exec ultracite doctor`

Oxlint + Oxfmt (the underlying engine) provides robust linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility:
  - Provide meaningful alt text for images
  - Use proper heading hierarchy
  - Add labels for form inputs
  - Include keyboard event handlers alongside mouse events
  - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns
- Avoid import cycles; move shared code into a module both sides import

### Security

- Add `rel="noopener noreferrer"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
- Use proper image components (e.g., Next.js `<Image>`) over `<img>` tags

### Framework-Specific Guidance

**Next.js:**

- Use Next.js `<Image>` component for images
- Use `next/head` or App Router metadata API for head elements
- Use Server Components for async data fetching instead of async Client Components

**React 19+:**

- Use ref as a prop instead of `React.forwardRef`

**Solid/Svelte/Vue/Qwik:**

- Use `class` and `for` attributes (not `className` or `htmlFor`)

---

## Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

## When Oxlint + Oxfmt Can't Help

Oxlint + Oxfmt will catch most mechanical issues automatically. Focus your attention on:

1. **Business logic correctness** - Oxlint + Oxfmt can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code

---

Most formatting and common issues are automatically fixed by Oxlint + Oxfmt. Run `pnpm exec ultracite fix` before committing to ensure compliance.
