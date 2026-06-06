# 04 - Database and Seeding

## Local Table of Contents

- [Schema Organization](#schema-organization)
- [Migration Rule](#migration-rule)
- [Seeding Workflow](#seeding-workflow)
- [Data Integrity Checks](#data-integrity-checks)

## Schema Organization

- Keep table schemas under `lib/db/schema/`.
- Export new schemas via `lib/db/schema/index.ts`.
- Keep constraints close to schema definitions (indexes, unique rules, foreign keys).

## Migration Rule

Do not manually create or modify files under `drizzle/`.

When schema changes are required:

- Use project-approved push workflow for development.
- Use project-approved generate workflow for production migration output.

## Seeding Workflow

- Add module seed files under `lib/db/seed/`.
- Preserve deterministic ordering and stable IDs when possible.
- Keep seed content representative for QA and demos (draft + published scenarios).

## Data Integrity Checks

- Validate unique and partial-unique constraints.
- Validate nullable fields and soft-delete expectations.
- Ensure published/draft rules are enforced at DB and service layers.

---

<p align="center">
  <a href="./03-architecture-overview.md">⬅️ Previous</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./README.md">🏠 Back to Docs Index</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./05-content-workflows.md">Next ➡️</a>
</p>
