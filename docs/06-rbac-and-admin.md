# 06 - RBAC and Admin

## Local Table of Contents

- [RBAC Model](#rbac-model)
- [Scope and Permission Flow](#scope-and-permission-flow)
- [Admin Navigation Integration](#admin-navigation-integration)
- [Authorization Validation](#authorization-validation)

## RBAC Model

- Access control is organized by scopes and permissions.
- Scopes represent domain areas.
- Permissions define allowed actions (access, create, update, delete, etc.).

## Scope and Permission Flow

1. Define scope in RBAC schema/constants.
2. Register enforcement in procedure guards and admin route protection.
3. Wire scope checks in client UI with permission helpers.

## Admin Navigation Integration

- Add module entries to admin navigation only when scope access is available.
- Keep nav grouping consistent with existing information architecture.

## Authorization Validation

- Validate protected routes via server checks.
- Ensure API procedures reject unauthorized actions.
- Confirm proxy/route mapping includes new admin paths.

---

<p align="center">
  <a href="./05-content-workflows.md">⬅️ Previous</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./README.md">🏠 Back to Docs Index</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./07-testing-quality-and-ci.md">Next ➡️</a>
</p>
