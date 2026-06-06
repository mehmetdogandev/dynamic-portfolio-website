# S3 Function: getSignedUploadUrl

## Purpose

Generates a time-limited presigned upload URL (PUT) for a single object name.

## Signature

`getSignedUploadUrl(fileName, mimeType, options?) => Promise<string>`

## Notes

- Uses `presignedPutObject`
- Returned URL is protocol-relative
- Uploading through this URL does not automatically create a DB row

## Critical Rule

After upload, you still need a `file` table record if this file is app-managed.

---

<p align="center">
  <a href="./07-getSignedDownloadUrl.md">⬅️ Previous</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="../README.md">🏠 Back to Docs Index</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./09-getSignedUrls.md">Next ➡️</a>
</p>
