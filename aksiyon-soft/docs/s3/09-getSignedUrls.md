# S3 Function: getSignedUrls

## Purpose

Bulk helper for generating multiple presigned URLs (upload or download).

## Signature

`getSignedUrls(fileNames, type?, mimeType?, options?) => Promise<Array<{ fileName; url }>>`

## Behavior

- For `type=download`, uses `getSignedDownloadUrl`
- For `type=upload`, uses `getSignedUploadUrl` when `mimeType` exists

---

<p align="center">
  <a href="./08-getSignedUploadUrl.md">⬅️ Previous</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="../README.md">🏠 Back to Docs Index</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./10-fileExists.md">Next ➡️</a>
</p>
