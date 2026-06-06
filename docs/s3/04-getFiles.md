# S3 Function: getFiles

## Purpose

Downloads multiple files by calling `getFile` for each filename.

## Signature

`getFiles(fileNames, bucket?) => Promise<Array<{ fileName; data }>>`

## Behavior

- Parallel reads with `Promise.all`
- Output includes original filename and data buffer

---

<p align="center">
  <a href="./03-getFile.md">⬅️ Previous</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="../README.md">🏠 Back to Docs Index</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./05-deleteFile.md">Next ➡️</a>
</p>
