# S3 Function: getFileFromS3

## Purpose

Fetches file bytes directly from storage using async stream iteration.

## Signature

`getFileFromS3(fileName, bucket?) => Promise<Buffer>`

## Difference From `getFile`

Both return buffers, but this helper uses `for await` stream iteration style.

---

<p align="center">
  <a href="./17-listFilesWithRecords.md">⬅️ Previous</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="../README.md">🏠 Back to Docs Index</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./README.md">Next ➡️</a>
</p>
