# 08 - Troubleshooting

## Local Table of Contents

- [Install or Boot Failures](#install-or-boot-failures)
- [Environment Problems](#environment-problems)
- [DB and Seed Problems](#db-and-seed-problems)
- [Editor and Content Issues](#editor-and-content-issues)

## Install or Boot Failures

- Remove stale lock artifacts only when team policy allows.
- Re-run `pnpm install`.
- Verify Node and `pnpm` versions match team baseline.

## Environment Problems

- Confirm all required `.env` keys exist.
- Check for malformed URLs and invalid credentials.
- Restart dev server after environment changes.

## DB and Seed Problems

- Verify database connectivity before seed scripts.
- Ensure schema and seed expectations match active branch.
- Respect migration folder rules and team migration flow.

## Editor and Content Issues

- Validate that editor output matches public render styles.
- Check media class names and content normalization paths.
- Confirm selected published content exists when public pages appear empty.

---

<p align="center">
  <a href="./07-testing-quality-and-ci.md">⬅️ Previous</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./README.md">🏠 Back to Docs Index</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./09-release-checklist.md">Next ➡️</a>
</p>
