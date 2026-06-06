# 09 - Release Checklist

## Local Table of Contents

- [Pre-Release Checks](#pre-release-checks)
- [Data and Content Validation](#data-and-content-validation)
- [Security and Access Review](#security-and-access-review)
- [Deployment and Post-Release](#deployment-and-post-release)

## Pre-Release Checks

- Branch is up to date with target base.
- Scope is documented in changelog/release notes.
- `pnpm lint` and `pnpm typecheck` pass.

## Data and Content Validation

- Published content state is correct for website-critical modules.
- Seeds and DB constraints are consistent with release assumptions.
- No accidental static fallback overrides DB-backed content.

## Security and Access Review

- RBAC paths are protected.
- Sensitive values are environment-based, not hardcoded.
- Admin-visible modules are permission-gated.

## Deployment and Post-Release

1. Deploy via approved pipeline.
2. Run smoke tests on primary website and admin flows.
3. Confirm logs/monitoring stay healthy.
4. Record release notes and rollback context.

---

<p align="center">
  <a href="./08-troubleshooting.md">⬅️ Previous</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./README.md">🏠 Back to Docs Index</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./10-admin-rbac-and-trpc-authorization-flow.md">Next ➡️</a>
</p>
