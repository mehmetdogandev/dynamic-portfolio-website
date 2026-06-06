# S3 Function: getFileRecordByName

## Purpose

Fetches one `file` table row by `(fileName, bucket)`.

## Signature

`getFileRecordByName(fileName, bucket?) => Promise<FileRecord | null>`

## Usage

Useful when only storage object identifiers are known.

Prefer `getFileRecord(fileId)` when possible, because IDs are stable references.

---

<p align="center">
  <a href="./14-getFileRecord.md">⬅️ Previous</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="../README.md">🏠 Back to Docs Index</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./16-getFileWithLogging.md">Next ➡️</a>
</p>
