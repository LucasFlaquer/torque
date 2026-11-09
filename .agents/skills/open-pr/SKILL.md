---
name: open-pr
description: Open a GitHub pull request for the current branch of the Torque repository, linked to an issue from the "Torque v1" GitHub Project and reflected on that project board. Takes an optional issue reference — its key ("S1-01"), its full title ("S1-01: Monorepo, tooling and Compose") or its number ("#10" / "10") — plus an optional "--draft". Use when the user types "/open-pr".
argument-hint: "[S1-01 | \"S1-01: Title\" | #10] [--draft]"
disable-model-invocation: true
---

# Open a pull request

Open a PR from the current branch into `main`, fill `.github/pull_request_template.md`, link it to the issue with a closing keyword and sync the "Torque v1" project board.

Arguments: `$ARGUMENTS`

## Fixed values

| Thing | Value |
| --- | --- |
| Repository | `LucasFlaquer/torque` |
| Base branch | `main` |
| Project | number `4`, owner `LucasFlaquer` ("Torque v1") |
| Status options | `Todo`, `In Progress`, `Done` |
| Other fields copied from the issue | `Sprint` (iteration), `Area` (single select) |

If a project command fails because a field or option no longer exists, run `gh project field-list 4 --owner LucasFlaquer --format json` and adapt instead of guessing.

## 1. Parse the arguments

- `--draft` anywhere in the arguments opens the PR as a draft. Remove it before resolving the issue.
- What is left is the issue reference. It may be empty.

## 2. Resolve the issue

| Reference | How to resolve |
| --- | --- |
| `#10` or `10` | `gh issue view 10 --json number,title,state,url,labels,milestone` |
| A key like `S1-01` (pattern `S\d+-\d+`) or a full title like `S1-01: Monorepo, tooling and Compose` | Take the key from the start of the text, then `gh issue list --state all --search "<key> in:title" --json number,title,state,url --limit 20` and keep only titles that start with `<key>:`. With a full title, also check that the rest matches (ignore case). |
| Any other text | `gh issue list --state all --search "<text> in:title" --json number,title,state,url --limit 20` |
| Empty | Look for a key (`S\d+-\d+`, any case) in the branch name and resolve it as above. If there is none, open the PR without an issue and skip step 6. |

- Exactly one match: use it.
- No match or several matches: stop and ask the user which issue they mean, listing the candidates with number and title. Never pick one silently.
- Issue is `CLOSED`: tell the user and ask whether to continue.
- Read the issue body (`gh issue view <n> --json body`) for its "Done when" section; it feeds the PR summary and "How to test".

## 3. Check the branch

1. `git branch --show-current`. If it is `main`, stop: ask the user for a branch name (suggest `feat/<key-lowercase>-<short-slug>`, e.g. `feat/s1-01-monorepo-tooling`), create it, and continue there.
2. `git status --porcelain`. If there are uncommitted changes, show them and ask whether to commit them (following the format in `.agents/skills/commit/SKILL.md`, ending with the attribution line from the system reminder) or leave them out. Never commit without a yes.
3. `git log --oneline main..HEAD`. If it is empty, stop: there is nothing to open a PR for.
4. `gh pr list --head <branch> --state open --json number,url`. If a PR already exists, report its URL, do not open a second one, and go straight to step 6 to sync the project with that PR.

## 4. Run the checks

From the repository root, run `pnpm build`, `pnpm check` and `pnpm check-types` (and `pnpm test` if any workspace has a `test` script). If one fails, stop and show the shortest decisive error line. Do not open the PR with failing checks unless the user explicitly says to; if they do, open it as a draft and leave that checkbox unticked.

## 5. Push and create the PR

1. `git push -u origin <branch>`.
2. Title:
   - With an issue: the issue title as it is, e.g. `S1-01: Monorepo, tooling and Compose`.
   - Without an issue: a Conventional Commits summary of the branch, e.g. `feat: add service order list pagination`.
3. Body: fill `.github/pull_request_template.md` section by section. Write it to a file in the scratchpad directory and pass it with `--body-file`.
   - **Summary**: what changed and why, from `git log main..HEAD` and `git diff --stat main...HEAD`. Two to five bullets.
   - **Related issue**: `Closes #<n>` (this is what links the PR to the issue and closes it on merge). Without an issue, write `None`.
   - **Type of change**: tick (`- [x]`) the types that match the commit prefixes.
   - **Affected workspaces**: tick the ones whose paths appear in `git diff --name-only main...HEAD`.
   - **How to test**: concrete steps, based on the issue's "Done when" when there is one.
   - **Screenshots**: delete the section unless `apps/web` or `packages/ui` changed; then leave a note that screenshots are still needed.
   - **Checklist**: tick only what step 4 actually verified, plus items that are really true (migrations, `.env.example`, docs). Leave the rest unticked.
   - End the body with the pull request attribution line from the system reminder.
4. Create it:

   ```sh
   gh pr create --base main --head <branch> --title "<title>" --body-file <file> --assignee @me [--draft] [--milestone "<issue milestone title>"] [--label <issue labels, comma separated>]
   ```

   Copy the milestone and labels from the issue when it has them.

## 6. Sync the project board

Skip this step when there is no issue.

1. Make sure the issue is on the board, and read its current values:

   ```sh
   gh api graphql -f query='
     query($n: Int!) {
       repository(owner: "LucasFlaquer", name: "torque") {
         issue(number: $n) {
           projectItems(first: 20) {
             nodes {
               id
               project { number }
               status: fieldValueByName(name: "Status") { ... on ProjectV2ItemFieldSingleSelectValue { name } }
               area: fieldValueByName(name: "Area") { ... on ProjectV2ItemFieldSingleSelectValue { name } }
               sprint: fieldValueByName(name: "Sprint") { ... on ProjectV2ItemFieldIterationValue { title iterationId } }
             }
           }
         }
       }
     }' -F n=<issue number>
   ```

   Keep the node whose `project.number` is `4`. If there is none, add the issue: `gh project item-add 4 --owner LucasFlaquer --url <issue url>`.

2. Move the issue to `In Progress` when its status is `Todo` or empty. Never move it backwards from `Done`.

   ```sh
   gh project item-edit 4 --owner LucasFlaquer --url <issue url> --field Status --value "In Progress"
   ```

3. Add the PR to the board and give it the issue's values:

   ```sh
   gh project item-add 4 --owner LucasFlaquer --url <pr url> --format json --jq .id   # PR item id
   gh project item-edit 4 --owner LucasFlaquer --url <pr url> --field Status --value "In Progress"
   gh project item-edit 4 --owner LucasFlaquer --url <pr url> --field Area --value "<issue area>"   # only if the issue has one
   ```

   For `Sprint`, set it by IDs (only if the issue has one):

   ```sh
   PROJECT_ID=$(gh project view 4 --owner LucasFlaquer --format json --jq .id)
   SPRINT_FIELD_ID=$(gh project field-list 4 --owner LucasFlaquer --format json --jq '.fields[] | select(.name == "Sprint") | .id')
   gh project item-edit --id <PR item id> --project-id "$PROJECT_ID" --field-id "$SPRINT_FIELD_ID" --iteration-id <issue iterationId>
   ```

4. Confirm the link: `gh pr view <pr url> --json closingIssuesReferences --jq '.closingIssuesReferences[].number'` must list the issue number. If it does not, the `Closes #<n>` line is missing or malformed; fix the body with `gh pr edit --body-file`.

The issue's "Linked pull requests" field on the board fills in by itself from the closing keyword. When the PR merges, the issue closes and the project's built-in "Item closed" workflow moves it to `Done`.

## 7. Report

Reply with:

- The PR URL and title.
- The linked issue (`#<n> <title>`), or that the PR has no issue.
- What changed on the board: issue status before and after, and that the PR was added with Status, Sprint and Area.
- Any check that failed or was skipped, and any checklist item left unticked.

## Rules

- Never force-push, never push to `main`, never merge the PR.
- Never commit, create a branch or open a PR for a different issue without the user's yes when the input is ambiguous.
- Write the PR title and body in English.
