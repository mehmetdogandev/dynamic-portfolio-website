# 05 - Content Workflows

## Local Table of Contents

- [Editorial Modules](#editorial-modules)
- [Rich Content Authoring](#rich-content-authoring)
- [Publish Lifecycle](#publish-lifecycle)
- [Website Rendering](#website-rendering)

## Editorial Modules

Current editorial workflows include blog-like modules and about-page content with admin CRUD and publish controls.

## Rich Content Authoring

- Use the shared editor component for consistent behavior.
- Keep media alignment and resize interactions consistent.
- Store content in module-specific structures compatible with public styles.

## Publish Lifecycle

- Draft entries can coexist.
- Single-published mode is enforced where required (for example, about content).
- Publish updates should maintain deterministic fallback behavior for website rendering.

## Website Rendering

- Public routes consume normalized data-access functions.
- Avoid duplicated static copy when DB-backed content exists.
- Reuse style primitives for visual consistency across content pages.

## Media Storage Integration Rule

- Media uploads should go through `lib/s3/uploadFile` or `uploadFiles`.
- Persist returned `fileId` (`file.id`) in your module tables as reference.
- Do not treat raw object key (`fileName`) as the only relational key.
- Resolve file metadata/render URL via the `file` table record when needed.

---

<p align="center">
  <a href="./04-database-and-seeding.md">⬅️ Previous</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./README.md">🏠 Back to Docs Index</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./06-rbac-and-admin.md">Next ➡️</a>
</p>
