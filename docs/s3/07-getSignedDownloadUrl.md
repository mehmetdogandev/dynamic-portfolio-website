# S3 Function: getSignedDownloadUrl

## Purpose

Generates a time-limited presigned download URL for a single object.

## Signature

`getSignedDownloadUrl(fileName, options?) => Promise<string>`

## Notes

- Default expiry: 3600 seconds
- Returns protocol-relative URL to reduce mixed-content issues

---

<p align="center">
  <a href="./06-deleteFiles.md">⬅️ Previous</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="../README.md">🏠 Back to Docs Index</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./08-getSignedUploadUrl.md">Next ➡️</a>
</p>
