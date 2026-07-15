---
description: Self-correcting build → verify → fix loop until the work is provably green.
---

When I invoke /loop (optionally with a task, or "work the task list"), run a self-correcting build–verify–fix iteration until the work is provably green:

1. **Build the next item** — one increment of the plan, or the next task on the list.
2. **Verify with real, machine-checkable checks.** For this repo: `npm run typecheck` (tsc --noEmit), `npm test` (all six `*.test.ts` suites via tsx — scoring / brand / ord / admin / voice / weekly-loop), and `npm run lint` (next lint, Strict). Run tests via the npm scripts or `npx tsx <file>` — the bare `node --import tsx/esm <file>` form breaks on Node 22+. For non-code work, define the closest contract — a script, a grep, render-to-image + view, etc.
3. **Use a separate verifier for anything high-stakes** — spawn an independent subagent (Agent/Task tool) to check the result against the spec and tests, rather than grading your own work.
4. **Feed every failure back as the next instruction and fix it.** Re-run the checks. Repeat.
5. **Finish only when** the build is green and the verifier has nothing left to report — the contract passes.
6. **Hard stops — halt and surface to me, don't loop forever — if:** you make no progress, repeat the same approach, flip-flop between approaches, the verifier rejects the same thing twice, or you hit a reasonable budget. Report exactly what's blocking.

Pairs with /goal: when a goal/contract is set, loop toward that contract specifically.

Keep a running task list. Only mark a task complete after its checks pass. If a hard-stop trigger fires, stop and explain rather than thrashing. I want tight, objective, self-correcting iteration with real pass/fail gates — not open-ended fiddling or a self-congratulatory "done."
