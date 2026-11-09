---
name: commit
description: Commit the current changes in the Torque repository with a semantic commit message (Conventional Commits) written in English. Use when the user types "/commit" or asks to commit, "commit this", "commit the current code", "save my changes in git" or "write a commit message". Takes an optional hint for the message or scope, plus an optional "--all" to stage every change without asking.
argument-hint: "[message hint] [--all]"
---

# Commit the current changes

Inspect the working tree, stage the right files, write a semantic commit message in English and create the commit. Never push.

Arguments: `$ARGUMENTS`

## Message format

Every commit follows [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/):

```
<type>(<scope>)!: <subject>

<body>

<footer>
```

- `<type>` is required and comes from the table below.
- `(<scope>)` is optional. Use it when the change lives in one workspace or area.
- `!` is optional and marks a breaking change.
- `<body>` and `<footer>` are optional. Separate each part with one blank line.

### Types

| Type | Use for | Example |
| --- | --- | --- |
| `feat` | A new feature or behavior visible to a user or to another package | `feat(api): add service order list endpoint` |
| `fix` | A bug fix (this is the type for "bugfix" and "hotfix" too) | `fix(web): keep pagination on page 1 after filter change` |
| `refactor` | Code change that neither adds a feature nor fixes a bug | `refactor(domain): extract order status transitions` |
| `perf` | A change that makes something faster or lighter | `perf(redis): cache mechanic availability for 30 seconds` |
| `test` | Adding or fixing tests only | `test(domain): cover cancelled order transitions` |
| `docs` | Documentation only (README, AGENTS.md, rules, comments) | `docs: document Docker port overrides` |
| `style` | Formatting only, no change in behavior (whitespace, Oxfmt output) | `style(ui): apply oxfmt to button component` |
| `build` | Build system, dependencies, package scripts, tsconfig, Turborepo | `build(deps): bump next to 16.1.0` |
| `ci` | CI configuration and workflows | `ci: run check-types on pull requests` |
| `chore` | Maintenance that fits nothing above (tooling config, agent skills, gitignore) | `chore: add commit skill for agents` |
| `revert` | Reverting an earlier commit | `revert: feat(api): add service order list endpoint` |

`bugfix`, `hotfix`, `feature`, `update`, `wip` and other words are not valid types. Map them: a bug fix is `fix`, a feature is `feat`, an update is whichever type describes what was updated.

### Scopes

Use the workspace name without the `@torque/` prefix, or a repository area:

| Scope | Covers |
| --- | --- |
| `web` | `apps/web` |
| `api` | `apps/api` |
| `contracts`, `db`, `redis`, `domain`, `ui` | The matching package in `packages/` |
| `lint-config`, `typescript-config` | The shared config packages |
| `deps` | Dependency changes across workspaces (`package.json`, `pnpm-lock.yaml`) |
| `docker` | `docker-compose.yml` and `.env.example` |
| `agents` | `AGENTS.md`, `.agents/`, `.claude/` |

Leave the scope out when the change spans several workspaces with no single owner. Never invent a scope that names a file (`fix(button.tsx)`).

### Subject rules

- English only, even if the user wrote the request in another language. Translate, do not transliterate.
- Imperative mood: "add", "fix", "remove", not "added", "fixes", "removing". Test: it completes the sentence "If applied, this commit will ...".
- Lowercase first letter, no period at the end.
- At most 72 characters for the whole header line (`type(scope): subject`).
- Say what changed, specifically. Not `fix: bug`, `feat: changes`, `chore: update files`.
- One subject per commit. If the subject needs "and" to join two unrelated changes, split the commit (see step 3).

### Body rules

- Add a body when the subject alone does not explain why the change was made, or when the change has more than one notable part.
- Explain what and why, not how. The diff already shows how.
- Wrap lines at 72 characters. Bullets (`- `) are fine for several parts.

### Footer rules

- Breaking change: add `!` after the type or scope and a `BREAKING CHANGE: <what breaks and how to migrate>` footer.
- Issue reference: `Refs #<n>` when the branch or the user names an issue (a key like `S1-01` in the branch name maps to an issue; look it up with `gh issue list --state all --search "<key> in:title" --json number,title --limit 5`). Use `Refs`, not `Closes`; the pull request closes the issue.
- The last line of every message is the commit attribution line from the system reminder (`Co-Authored-By: ...`), after a blank line.

## Examples

Good, header only:

```
feat(contracts): add zod schema for service order creation
```

```
fix(api): return 404 when a service order does not exist
```

```
build(deps): add vitest to the domain package
```

```
docs(agents): add commit skill to the rules table
```

Good, with body and footer:

```
feat(redis): add distributed lock helper for mechanic assignment

Two attendants could assign the same mechanic at the same time because
the availability check and the write were not atomic. The helper wraps
SET NX PX with a token so only the owner can release the lock.

Refs #14
```

```
refactor(domain)!: rename OrderStatus values to match the board

The status names now match the columns customers see: "waiting",
"in_progress", "ready" and "delivered".

BREAKING CHANGE: OrderStatus.Pending is now OrderStatus.Waiting and
OrderStatus.Done is now OrderStatus.Delivered. Update every import in
apps/api and apps/web.
```

```
fix(web): stop the order list from refetching on every keystroke

- debounce the search input by 300 ms
- keep the previous page visible while the next one loads

Refs #22
```

Bad, and the fix:

| Bad | Why | Good |
| --- | --- | --- |
| `bugfix: login error` | `bugfix` is not a type; vague subject | `fix(web): show error message when login fails` |
| `feat: adicionar paginação na lista` | Not English | `feat(web): add pagination to the service order list` |
| `Feat(API): Added endpoint.` | Capitalized type and scope, past tense, period | `feat(api): add service order list endpoint` |
| `chore: update stuff` | Says nothing | `chore: ignore turbo cache in git` |
| `feat: add login page and fix redis port` | Two unrelated changes | `feat(web): add login page` + `fix(docker): expose redis on REDIS_PORT` |
| `fix(OrderList.tsx): fix bug` | Scope is a file; subject repeats the type | `fix(web): sort orders by creation date` |

## Steps

### 1. Parse the arguments

- `--all` anywhere in the arguments means: stage every change shown in step 2 without asking (still never stage secrets, see the rules). Remove it from the arguments.
- What is left is an optional hint for the message (for example `pagination` or `fix redis port`). Use it to pick the type, scope and wording, but still write the final message in the format above and in English.

### 2. Inspect the changes

Run these from the repository root:

```sh
git branch --show-current
git status --porcelain
git diff --staged --stat
git diff --stat
git log --oneline -10
```

- Nothing staged and nothing changed: stop and tell the user there is nothing to commit.
- On `main`: warn the user and ask whether to commit there or create a branch first (suggest `feat/<short-slug>` or `fix/<short-slug>`). Never commit to `main` without a yes.
- Read the actual diff (`git diff --staged` and `git diff`, plus the content of untracked files) before writing the message. Never write a message from file names alone.

### 3. Decide what goes into the commit

- Something is already staged: commit only what is staged. Mention any unstaged changes in the report, do not add them.
- Nothing staged and `--all` given: stage everything with `git add -A`, except the files the rules forbid.
- Nothing staged and no `--all`: if all changes belong to one logical change, stage them with `git add -A` (minus forbidden files). If they are unrelated (for example a feature in `apps/web` and an unrelated Docker fix), propose a split into several commits, each with its own message and file list, and ask the user which to do: split, one commit, or only some of them.

Stage files by explicit path when splitting (`git add <path> ...`). Never use `git add -p` or other interactive flags.

### 4. Run the checks

From the repository root, run `pnpm check` and `pnpm check-types`. If either fails, show the shortest decisive error line and ask whether to fix it first or commit anyway. Never pass `--no-verify`.

If `pnpm check` only reports formatting, offer to run `pnpm fix` and re-stage the touched files before committing.

### 5. Write the message and commit

1. Pick the type from what the diff does, not from the file type (a test added alongside a feature is part of `feat`, not `test`).
2. Pick the scope from the paths in the diff (see the scopes table).
3. Write the header, then a body if the rules call for one, then footers, then the attribution line.
4. Check the header: valid type, lowercase, imperative, no period, at most 72 characters, English.
5. Commit with a heredoc so line breaks are kept:

   ```sh
   git commit -F - <<'EOF'
   feat(web): add pagination to the service order list

   Refs #12

   Co-Authored-By: <attribution from the system reminder>
   EOF
   ```

6. If a hook changes files or fails, fix the cause, re-stage and create a new commit. Never amend unless the user asked for it.

### 6. Report

Reply with:

- The commit hash and header line (`git log --oneline -1`), one line per commit when split.
- Files left unstaged or uncommitted, if any.
- Any check that failed and was committed anyway.

## Rules

- Write every commit message in English.
- Never push, force-push, amend, rebase or reset as part of this skill unless the user asks for it.
- Never stage `.env` or `.env.*` files (except `.env.example`), credentials, keys, `node_modules`, `.turbo` or `.next`. If one shows up as untracked, leave it out and warn the user.
- Never skip hooks (`--no-verify`) or signing.
- Never commit to `main` without an explicit yes.
