# S3 Function: listFiles

## Purpose

Lists objects in a bucket with optional prefix and max limit.

## Signature

`listFiles(bucket?, prefix?, maxFiles?) => Promise<Array<{ name; size; lastModified; etag }>>`

## Notes

- Reads from object storage stream
- No DB join in this helper

---

<p align="center">
  <a href="./11-getFileMetadata.md">⬅️ Previous</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="../README.md">🏠 Back to Docs Index</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./13-copyFile.md">Next ➡️</a>
</p>
