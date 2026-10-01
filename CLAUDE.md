# Project rules

- Every change starts from a GitHub issue; the PR body includes `Fixes #N`.
- One issue, one small PR. Do not refactor unrelated code.
- Commit messages: `<type>: <description>` (feat, fix, refactor, test, docs, chore), one line.
- Never add Co-Authored-By trailers or any tool attribution to commits, PRs or code.
- Every bug fix comes with a test that fails before the fix, including the error path.
- Before pushing: `pnpm typecheck && pnpm test` must pass.
- Code and comments in English. No `any`.
