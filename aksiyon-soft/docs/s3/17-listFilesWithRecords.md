# S3 Function: listFilesWithRecords

## Purpose

Lists files from DB (`file` table) with optional filters.

## Signature

`listFilesWithRecords(organizationId?, uploadedBy?, isPublic?, limit?) => Promise<FileRecord[]>`

## Filters

- `organizationId`
- `uploadedBy`
- `isPublic`
- Always excludes deleted records

## Why This Is Preferred in Admin

For app-facing pages, DB listing is usually better than raw bucket listing because it includes ownership and metadata context.

---

<p align="center">
  <a href="./16-getFileWithLogging.md">⬅️ Previous</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="../README.md">🏠 Back to Docs Index</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./18-getFileFromS3.md">Next ➡️</a>
</p>
