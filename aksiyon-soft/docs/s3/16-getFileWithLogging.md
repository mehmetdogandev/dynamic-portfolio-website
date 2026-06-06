# S3 Function: getFileWithLogging

## Purpose

Resolves file record first, then returns file bytes from S3.

## Signature

`getFileWithLogging(fileName, bucket?, accessType?) => Promise<Buffer>`

## Current Behavior

- Verifies DB record exists with `getFileRecordByName`
- Fetches object using `getFile`
- Access logging hook is present as placeholder in code comments

---

<p align="center">
  <a href="./15-getFileRecordByName.md">⬅️ Previous</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="../README.md">🏠 Back to Docs Index</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./17-listFilesWithRecords.md">Next ➡️</a>
</p>
