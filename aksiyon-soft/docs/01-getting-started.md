# 01 - Getting Started

## Local Table of Contents

- [Prerequisites](#prerequisites)
- [First-Time Setup](#first-time-setup)
- [Run Modes](#run-modes)
- [Verification Checklist](#verification-checklist)

## Prerequisites

- Node.js LTS installed
- `pnpm` installed globally
- PostgreSQL access (local or remote)
- `.env` values provided by the team

## First-Time Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create `.env` from team-provided template and fill required values.
3. Start developer bootstrap flow:

```bash
pnpm run cli
```

## Run Modes

- **Developer mode**: `pnpm run cli`
- **CI/Product mode**: `pnpm run ci`
- **Direct dev server**: `pnpm dev`

## Verification Checklist

- `pnpm dev` starts without runtime errors.
- Home page and admin panel routes load.
- Authentication and RBAC-protected areas behave as expected.

---

<p align="center">
  <a href="./README.md">⬅️ Previous</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./README.md">🏠 Back to Docs Index</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./02-environment-and-config.md">Next ➡️</a>
</p>
