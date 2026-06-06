# 07 - Testing, Quality, and CI

## Local Table of Contents

- [Quality Gates](#quality-gates)
- [Local Validation Routine](#local-validation-routine)
- [CI Expectations](#ci-expectations)
- [PR Readiness](#pr-readiness)

## Quality Gates

Mandatory checks:

- `pnpm lint`
- `pnpm typecheck`

## Local Validation Routine

```bash
pnpm lint
pnpm typecheck
```

Run both commands after substantive changes and fix all introduced issues.

## CI Expectations

- Keep build and type safety green.
- Avoid flaky workflows by using deterministic seed/test assumptions.
- Keep docs and code changes aligned when developer behavior changes.

## PR Readiness

- Feature behavior verified manually.
- Lint and type checks pass.
- RBAC and route constraints validated.
- Documentation links still valid.

---

<p align="center">
  <a href="./06-rbac-and-admin.md">⬅️ Previous</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./README.md">🏠 Back to Docs Index</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./08-troubleshooting.md">Next ➡️</a>
</p>
