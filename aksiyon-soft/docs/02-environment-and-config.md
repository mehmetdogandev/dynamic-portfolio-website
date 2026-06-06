# 02 - Environment and Config

## Local Table of Contents

- [Environment Strategy](#environment-strategy)
- [Required Variables](#required-variables)
- [Config Practices](#config-practices)
- [Security Notes](#security-notes)

## Environment Strategy

- Keep local, staging, and production values isolated.
- Never commit secret keys into git.
- Validate new environment keys with team conventions before merging.

## Required Variables

Typical groups used in this project:

- Database connection values
- Authentication/session values
- Storage service values
- Public website runtime values

Follow existing keys in current `.env` examples and deployment settings.

## Config Practices

- Use explicit, descriptive key names.
- Keep defaults minimal and safe.
- Document newly introduced keys in PR descriptions.
- Update this documentation when configuration behavior changes.

## Security Notes

- Rotate exposed keys immediately.
- Scope external API keys with minimum required permissions.
- Prefer server-only access for sensitive variables.

---

<p align="center">
  <a href="./01-getting-started.md">⬅️ Previous</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./README.md">🏠 Back to Docs Index</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="./03-architecture-overview.md">Next ➡️</a>
</p>
