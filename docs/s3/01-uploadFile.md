# S3 Function: uploadFile

## Purpose

Uploads a single file to object storage and creates a `file` table record.

## Signature

`uploadFile(file, originalName, mimeType, config) => Promise<UploadResult>`

## Flow

1. Validates size, MIME type, and extension.
2. Ensures bucket exists.
3. Uploads object to S3/MinIO.
4. Inserts a row into `file` table.
5. Builds URL using inserted DB ID (`api/files/{id}/view`).
6. Updates record with final URL and returns metadata.

## Critical Rule

Use returned `fileId` (`id`) as foreign key in your feature tables.

Do not rely only on raw object name. Your domain table should reference `file.id`.

---

<p align="center">
  <a href="./README.md">⬅️ Previous</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="../README.md">🏠 Back to Docs Index</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./02-uploadFiles.md">Next ➡️</a>
</p>
