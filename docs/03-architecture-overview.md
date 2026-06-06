# 03 - Architecture Overview

## Local Table of Contents

- [Core Layers](#core-layers)
- [Request Flow](#request-flow)
- [Content Rendering Model](#content-rendering-model)
- [Design Principles](#design-principles)

## Core Layers

- `app/`: Next.js route layer (website + admin panel)
- `components/`: reusable UI and feature components
- `lib/trpc/`: procedure definitions and router composition
- `lib/db/`: schema, DB access, and seed scripts
- `lib/navigation/`: admin navigation and access-oriented menu structure

## Request Flow

1. User action originates from website or admin UI.
2. UI calls tRPC procedures.
3. Procedure validates permissions and input.
4. DB operations execute via Drizzle.
5. Normalized response returns to UI.

## Content Rendering Model

- Rich content is stored in structured fields and rendered in website routes.
- Admin-side editors produce content compatible with public rendering styles.
- Shared render classes keep blog/about visual behavior consistent.

## Design Principles

- Type safety across API and DB boundaries.
- RBAC-first admin behavior.
- Reusable editor and table components.
- Maintainable, testable module boundaries.

---

<p align="center">
  <a href="./02-environment-and-config.md">⬅️ Previous</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./README.md">🏠 Back to Docs Index</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./04-database-and-seeding.md">Next ➡️</a>
</p>
