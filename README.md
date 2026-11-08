# Torque

Torque is a mechanic shop management app built to practice fullstack development, with a focus on data listing, pagination, caching and business rules under concurrency. The customer books a vehicle drop-off; the shop diagnoses, quotes, executes and delivers; the customer approves the quote and follows everything through the portal. It is a study and portfolio project.

Project board: [Torque v1](https://github.com/users/LucasFlaquer/projects/4)

## Roles

- **Customer** (`customer`): books vehicle drop-offs, approves or rejects quotes and follows their service orders through the customer portal.
- **Attendant** (`attendant`): registers customers and vehicles at the front desk, opens service orders, builds and sends quotes, delivers vehicles and records payments.
- **Mechanic** (`mechanic`): picks up service orders, records diagnoses and completes the work on their own orders.
- **Manager** (`manager`): does everything an attendant does, plus higher discounts, inventory, catalog, shop settings, staff and the dashboard.

## Planned stack

- **Web**: Next.js (App Router)
- **API**: Fastify
- **Database**: PostgreSQL + Prisma
- **Cache**: Redis
- **Auth**: Better Auth
- **Validation**: Zod
- **Monorepo**: pnpm + Turborepo
- **Testing**: Vitest + Testcontainers, Playwright

## Status

Initial scaffold: a Turborepo monorepo with a Next.js web app (`apps/web`) and shared packages (`@torque/ui`, `@torque/lint-config`, `@torque/typescript-config`). The API, database and domain packages are planned for Sprint 1.

## Getting started

```sh
pnpm install
pnpm dev
```

See [CLAUDE.md](./CLAUDE.md) for the full list of scripts and conventions.
