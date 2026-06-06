# 10 - Admin RBAC and tRPC Authorization Flow

## Local Table of Contents

- [Why This Page Exists](#why-this-page-exists)
- [RBAC Source of Truth](#rbac-source-of-truth)
- [Proxy-Level Route Protection](#proxy-level-route-protection)
- [tRPC Procedure-Level Protection](#trpc-procedure-level-protection)
- [Example: Blog List Procedure](#example-blog-list-procedure)
- [How to Add a New Admin Module Safely](#how-to-add-a-new-admin-module-safely)
- [Failure Modes and Debug Strategy](#failure-modes-and-debug-strategy)

## Why This Page Exists

This page explains exactly how admin authorization works across:

- `lib/db/schema/rbac.ts`
- `proxy.ts`
- tRPC routers such as `lib/trpc/router/blog.ts`

The goal is to make scope and permission behavior predictable when adding or debugging admin modules.

## RBAC Source of Truth

The RBAC contract is defined in `lib/db/schema/rbac.ts`.

- `permissionEnum` defines action verbs like `ACCESS`, `READ`, `CREATE`, `UPDATE`, `DELETE`.
- `scopesEnum` defines domain boundaries like `BLOG`, `ABOUT`, `MEDIA`.
- `SCOPES` and `PERMISSIONS` are exported enums used across server code.
- `role` stores permissions by scope.
- `roleGroup`, `roleGroupRole`, and `userRoleGroup` model assignment in grouped form.
- Partial unique indexes protect integrity for non-deleted rows.

Practical meaning:

- Scope answers: "Which module?"
- Permission answers: "Which action in that module?"

## Proxy-Level Route Protection

`proxy.ts` enforces coarse access control before page rendering.

Core flow:

1. Request path is matched against `pathsToScopes`.
2. Longest matching path wins (prevents prefix collisions).
3. Session is loaded via `getCachedSession`.
4. If no session: redirect to admin base.
5. If session exists: `canCached(userId, scope, PERMISSIONS.ACCESS)` is checked.
6. Authorized users continue, unauthorized users are redirected.

Important details:

- Protection here is page-level entry gating.
- Admin navigation URLs must be mapped in `pathsToScopes` or they remain unguarded by proxy scope checks.
- Logging emits `UNAUTHENTICATED_ACCESS`, `UNAUTHORIZED_ACCESS`, `AUTHORIZED_ACCESS`, and `NON_PROTECTED_PATH` events.

## tRPC Procedure-Level Protection

Even with proxy checks, each admin action must be guarded in tRPC.

Pattern:

```ts
list: rbacProcedure(SCOPES.BLOG, PERMISSIONS.READ)
```

This means:

- scope is `BLOG`
- permission required is `READ`
- only users with matching role assignment can call this procedure

Why both proxy and procedure checks:

- Proxy protects route entry.
- Procedure checks protect backend operations.
- API protection remains valid even if a client bypasses UI navigation.

## Example: Blog List Procedure

In `lib/trpc/router/blog.ts`, the `list` procedure uses:

```ts
list: rbacProcedure(SCOPES.BLOG, PERMISSIONS.READ)
```

Interpretation:

- `SCOPES.BLOG`: operation belongs to blog module.
- `PERMISSIONS.READ`: user needs read privilege within blog scope.

If the same module has write operations, they should use:

- create mutation: `PERMISSIONS.CREATE`
- update mutation: `PERMISSIONS.UPDATE`
- delete mutation: `PERMISSIONS.DELETE`

## How to Add a New Admin Module Safely

When introducing a module (example: `NEWS`):

1. Add scope in `scopesEnum` (`rbac.ts`).
2. Export and use it via `SCOPES`.
3. Add proxy path mapping in `proxy.ts`:
   - `${ADMIN_BASE}/news`: `SCOPES.NEWS`
4. Guard tRPC procedures with `rbacProcedure(SCOPES.NEWS, <permission>)`.
5. Gate admin UI and navigation with the same scope.
6. Validate role assignments contain expected permissions.

If one step is missed, you get inconsistent behavior (UI visible but API forbidden, or route open but API blocked).

## Failure Modes and Debug Strategy

- **Route redirects unexpectedly**: check `proxy.ts` path map and session.
- **API returns forbidden**: check `rbacProcedure` scope/permission pair.
- **UI visible but actions fail**: proxy and nav may be aligned, but procedure permission is stricter.
- **Actions visible for wrong users**: client-side check may be wrong, but server should still reject.

Quick checklist:

- Scope exists in `scopesEnum`.
- Path exists in `pathsToScopes`.
- Procedure uses correct permission level.
- Roles contain that scope-permission pair.

---

<p align="center">
  <a href="./09-release-checklist.md">⬅️ Previous</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./README.md">🏠 Back to Docs Index</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./s3/README.md">Next ➡️</a>
</p>
