# S3 Function: deleteFile

## Purpose

Hard-deletes one file from S3 and removes its DB record from `file` table.

## Signature

`deleteFile(fileName, bucket?) => Promise<void>`

## Behavior

1. Removes object from bucket.
2. Deletes matching DB row (`fileName` + `bucket`).

## Caution

This is hard-delete behavior, not soft-delete.

---

<p align="center">
  <a href="./04-getFiles.md">⬅️ Previous</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="../README.md">🏠 Back to Docs Index</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./06-deleteFiles.md">Next ➡️</a>
</p>
