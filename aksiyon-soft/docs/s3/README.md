# S3 Storage Function Reference

## Local Table of Contents

1. [uploadFile](./01-uploadFile.md)
2. [uploadFiles](./02-uploadFiles.md)
3. [getFile](./03-getFile.md)
4. [getFiles](./04-getFiles.md)
5. [deleteFile](./05-deleteFile.md)
6. [deleteFiles](./06-deleteFiles.md)
7. [getSignedDownloadUrl](./07-getSignedDownloadUrl.md)
8. [getSignedUploadUrl](./08-getSignedUploadUrl.md)
9. [getSignedUrls](./09-getSignedUrls.md)
10. [fileExists](./10-fileExists.md)
11. [getFileMetadata](./11-getFileMetadata.md)
12. [listFiles](./12-listFiles.md)
13. [copyFile](./13-copyFile.md)
14. [getFileRecord](./14-getFileRecord.md)
15. [getFileRecordByName](./15-getFileRecordByName.md)
16. [getFileWithLogging](./16-getFileWithLogging.md)
17. [listFilesWithRecords](./17-listFilesWithRecords.md)
18. [getFileFromS3](./18-getFileFromS3.md)

## Core Rule: Always Persist and Reuse File IDs

When you upload via `uploadFile`, a row is created in the `file` table and an `id` is returned (`id` / `fileId`).

This ID must be treated as canonical reference:

- If another table needs to point to a file, store the file table ID in that table.
- Do not store raw storage paths as your only relation key.
- Use the file ID to fetch metadata, render URLs, and maintain referential integrity.

---

<p align="center">
  <a href="../10-admin-rbac-and-trpc-authorization-flow.md">⬅️ Previous</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="../README.md">🏠 Back to Docs Index</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./01-uploadFile.md">Next ➡️</a>
</p>
