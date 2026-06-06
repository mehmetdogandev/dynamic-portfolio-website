# S3 Function: copyFile

## Purpose

Copies an object within the same bucket or across buckets.

## Signature

`copyFile(sourceFileName, destFileName, sourceBucket?, destBucket?) => Promise<void>`

## Important

This storage copy does not automatically clone/insert DB metadata rows.

If application data needs this file, insert/update `file` table accordingly.

---

<p align="center">
  <a href="./12-listFiles.md">⬅️ Previous</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="../README.md">🏠 Back to Docs Index</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./14-getFileRecord.md">Next ➡️</a>
</p>
