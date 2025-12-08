# Root-Cause First: Debugging & Fixing Policy

This repository follows a strict "Root-Cause First" debugging policy.
Before applying any change to the codebase that attempts to "fix" a symptom,
you must first reproduce and identify the underlying problem. Changes that
only hide symptoms without resolving the root cause are not acceptable.

High-level rule
---------------
- Never apply a change that only treats the observable symptom without
  documenting and resolving the root cause.

Required debugging workflow
--------------------------
1. Reproduce: Reproduce the issue reliably and capture reproducible steps.
2. Observe & Trace: Collect logs, traces, and instrumentation evidence that
   explain *why* the bug happens (timestamps, state changes, stack traces). 
3. Formulate Hypothesis: Based on the evidence, describe the likely root cause.
4. Implement Minimal Fix: Make the smallest change that addresses the root cause.
5. Validate: Reproduce again and confirm the fix resolves the root cause (not only
   the symptom).
6. Protect & Test: Add unit/integration tests and, if needed, monitoring to catch regressions.
7. Clean-up: Remove debugging hooks, transient logging, or workaround code used for diagnosing.

Why this matters
-----------------
- Fixes that address only the symptom tend to reappear, hide deeper bugs, and increase technical debt.
- Short-term patches without tests create fragile code. A root-cause-first approach increases long-term stability.

How contributors should use this
--------------------------------
- Add a short "Root-Cause Summary" to PR descriptions explaining how steps 1–3 were satisfied and the exact behavioral changes made in step 4.
- If you must apply a temporary workaround, label it clearly and create a follow-up issue to remove it once the root cause is fixed.

Enforcement
-----------
- Maintainers will request additional evidence (repro steps + traces) when a PR looks like it only masks a symptom.
- CI should include tests that assert the bug path is covered.

Keep this file near the top of your editing checklist and refer to it whenever debugging or fixing issues in this repository.
