# S3 Function: getFile

## Purpose

Downloads one object from S3/MinIO and returns it as `Buffer`.

## Signature

`getFile(fileName, bucket?) => Promise<Buffer>`

## Notes

- Uses object name + bucket
- Streams data and concatenates chunks
- No DB lookup is done here

## Recommended Usage

If you have `fileId`, resolve DB record first, then call with `fileName`/`bucket`.

---

<p align="center">
  <a href="./02-uploadFiles.md">⬅️ Previous</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="../README.md">🏠 Back to Docs Index</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./04-getFiles.md">Next ➡️</a>
</p>
