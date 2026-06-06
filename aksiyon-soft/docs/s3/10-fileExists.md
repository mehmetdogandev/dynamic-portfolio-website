# S3 Function: fileExists

## Purpose

Checks object existence in storage.

## Signature

`fileExists(fileName, bucket?) => Promise<boolean>`

## Behavior

- Uses `statObject`
- Returns `true` when found, `false` on errors/not found

---

<p align="center">
  <a href="./09-getSignedUrls.md">⬅️ Previous</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="../README.md">🏠 Back to Docs Index</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./11-getFileMetadata.md">Next ➡️</a>
</p>
