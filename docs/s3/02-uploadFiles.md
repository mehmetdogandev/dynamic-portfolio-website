# S3 Function: uploadFiles

## Purpose

Uploads multiple files in parallel by calling `uploadFile` for each item.

## Signature

`uploadFiles(files, config) => Promise<UploadResult[]>`

## Flow

- Maps each input file to `uploadFile(...)`
- Uses `Promise.all` for parallel processing
- Returns one `UploadResult` per file

## Critical Rule

Persist each returned `fileId` in your own table if the file is used by that record.

---

<p align="center">
  <a href="./01-uploadFile.md">⬅️ Previous</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="../README.md">🏠 Back to Docs Index</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./03-getFile.md">Next ➡️</a>
</p>
