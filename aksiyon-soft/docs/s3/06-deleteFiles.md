# S3 Function: deleteFiles

## Purpose

Hard-deletes multiple files from S3 and bulk-removes matching DB records.

## Signature

`deleteFiles(fileNames, bucket?) => Promise<void>`

## Behavior

- Calls `removeObjects` in storage
- Deletes DB rows with `inArray(fileName, fileNames)` and bucket filter

---

<p align="center">
  <a href="./05-deleteFile.md">⬅️ Previous</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="../README.md">🏠 Back to Docs Index</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./07-getSignedDownloadUrl.md">Next ➡️</a>
</p>
