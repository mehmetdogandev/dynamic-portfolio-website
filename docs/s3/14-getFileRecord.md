# S3 Function: getFileRecord

## Purpose

Fetches one `file` table row by `fileId`.

## Signature

`getFileRecord(fileId) => Promise<FileRecord | null>`

## Why It Matters

`fileId` is the stable application-level reference key.

Use this in services that store `file.id` in domain tables.

---

<p align="center">
  <a href="./13-copyFile.md">⬅️ Previous</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="../README.md">🏠 Back to Docs Index</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./15-getFileRecordByName.md">Next ➡️</a>
</p>
