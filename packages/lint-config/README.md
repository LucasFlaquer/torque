# `@torque/lint-config`

Shared [Oxlint](https://oxc.rs/docs/guide/usage/linter) and [Oxfmt](https://oxc.rs/docs/guide/usage/formatter) configuration built on the [Ultracite](https://www.ultracite.ai) presets.

| Export | Named config | Use it in |
| --- | --- | --- |
| `@torque/lint-config/oxlint/base` | `baseConfig` | Plain TypeScript packages |
| `@torque/lint-config/oxlint/react` | `reactConfig` | React libraries (`packages/ui`) |
| `@torque/lint-config/oxlint/next` | `nextConfig` | Next.js apps (`apps/web`) |
| `@torque/lint-config/oxfmt` | `oxfmtConfig` | Every workspace |

Each workspace re-exports the config it needs as the default export of its own `oxlint.config.ts` and `oxfmt.config.ts`, because Oxlint and Oxfmt use the nearest config file:

```ts
export { nextConfig as default } from "@torque/lint-config/oxlint/next";
```

The configs are TypeScript files. Oxlint and Oxfmt load them through Node's type stripping (Node.js `>=22.18`), so they use only erasable syntax and import each other through the package name instead of relative `.ts` paths.

The Oxlint configs adjust the Ultracite presets to match [`.agents/rules/typescript.md`](../../.agents/rules/typescript.md): function declarations for functions and components, no parameter mutation, no type assertions except `as const`, and named exports except in tool config files and Next.js App Router files. Keep the rules and this config in sync.
