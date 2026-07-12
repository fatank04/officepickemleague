---
description: Restate a request as a precise, verifiable goal and confirm before building.
---

When I invoke /goal, do NOT start work yet. First rewrite my request into a precise goal, stated as:

- **Exact end state** — what "done" concretely looks like, observable and unambiguous.
- **How you will verify it** — the machine-checkable test or contract that proves it's done: a command, test, grep, render + screenshot, or a separate verifier subagent.
- **What you must not touch** — out-of-scope files, areas, or behaviors; the guardrails.
- **Stop condition** — when to declare done, and when to halt and report instead.

Then confirm that goal with me before executing. Once confirmed, execute against it — usually by running /loop toward that goal.

Treat the goal block as a contract. Everything that follows is measured against it. The point is to align on the real target and its verification up front, so effort doesn't go into building the wrong thing or over-reaching scope.
