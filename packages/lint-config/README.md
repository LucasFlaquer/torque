# `@torque/lint-config`

Shared [Oxlint](https://oxc.rs/docs/guide/usage/linter) and [Oxfmt](https://oxc.rs/docs/guide/usage/formatter) configuration built on the [Ultracite](https://www.ultracite.ai) presets.

| Export                             | Use it in                       |
| ---------------------------------- | ------------------------------- |
| `@torque/lint-config/oxlint/base`  | Plain TypeScript packages       |
| `@torque/lint-config/oxlint/react` | React libraries (`packages/ui`) |
| `@torque/lint-config/oxlint/next`  | Next.js apps (`apps/web`)       |
| `@torque/lint-config/oxfmt`        | Every workspace                 |

Each workspace re-exports the config it needs from its own `oxlint.config.ts` and `oxfmt.config.ts`, because Oxlint and Oxfmt use the nearest config file.
