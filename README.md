<div align="center">
  <table>
    <tr>
      <td align="center" valign="middle">
        <img src="public/favicon_io/android-chrome-192x192.png" alt="Aksiyon Soft Logo" width="78" height="78" />
      </td>
      <td align="left" valign="middle">
        <h1>AKSİYON SOFT</h1>
        <p><strong>Corporate Software Solutions Platform</strong></p>
      </td>
    </tr>
  </table>
</div>

<div align="center">
  <a href="#overview"><img alt="status" src="https://img.shields.io/badge/status-active-0a7ea4" /></a>
  <a href="#quick-start"><img alt="onboarding" src="https://img.shields.io/badge/onboarding-documented-1f883d" /></a>
  <a href="docs/README.md"><img alt="docs" src="https://img.shields.io/badge/developer_docs-ready-7f56d9" /></a>
</div>

## Overview

`Aksiyon Soft` is a production-grade web platform built with modern TypeScript tooling for corporate website management, admin workflows, content operations, and role-based access control.

This repository keeps the original Next.js bootstrap guidance and extends it with team-focused setup, architecture references, and operational documentation.

## Tech Stack

- Next.js App Router
- TypeScript
- tRPC
- Drizzle ORM
- PostgreSQL
- Tailwind CSS + shadcn/ui

## Getting Started

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to optimize and load [Geist](https://vercel.com/font).

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [Next.js GitHub Repository](https://github.com/vercel/next.js)

## Deploy on Vercel

The easiest way to deploy your Next.js app is the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

See the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Quick Start

### Developer Setup

<table width="100%" cellspacing="0" cellpadding="10">
  <tr>
    <td>
      <strong>Developer Setup Path</strong><br />
      1) Install dependencies<br />
      2) Create <code>.env</code> with required variables<br />
      3) Run development workflow<br /><br />
      <code>pnpm install</code><br />
      <code>pnpm run cli</code>
    </td>
  </tr>
</table>

### Product Setup

<table width="100%" cellspacing="0" cellpadding="10">
  <tr>
    <td>
      <strong>Product Setup Path</strong><br />
      1) Install dependencies<br />
      2) Create <code>.env</code> with product-ready configuration<br />
      3) Run CI-oriented workflow<br /><br />
      <code>pnpm install</code><br />
      <code>pnpm run ci</code>
    </td>
  </tr>
</table>

> For the full developer tutorial, visit [`docs/README.md`](docs/README.md).

## Scripts

- `pnpm dev`: start Next.js development server.
- `pnpm build`: create production build.
- `pnpm start`: run production server.
- `pnpm lint`: run lint checks.
- `pnpm typecheck`: run TypeScript checks.
- `pnpm run cli`: run development bootstrap workflow.
- `pnpm run ci`: run product/CI workflow.

## Project Structure

```text
app/                 # Next.js routes (site + admin panel)
components/          # Shared and feature-based UI components
lib/                 # Core business logic, tRPC, DB, helpers
docs/                # Multi-page developer reference documentation
public/              # Static assets and branding resources
```

## Developer Documentation

Use the complete engineering guide at [`docs/README.md`](docs/README.md). It includes architecture, environment, data workflows, RBAC, QA, troubleshooting, and release operations.

## Contributors

<div align="center">
<table width="92%" cellspacing="0" cellpadding="12">
  <tr>
    <td width="50%" valign="top" align="center">
      <table width="100%" cellspacing="0" cellpadding="10">
        <tr>
          <td width="92" align="center" valign="top">
            <a href="https://github.com/mehmetdogandev" aria-label="Mehmet DOĞAN GitHub Profile" target="_blank" rel="noopener noreferrer">
              <img src="https://avatars.githubusercontent.com/u/115467130?v=4" alt="Mehmet DOĞAN avatar" width="84" height="84" />
            </a>
          </td>
          <td valign="top">
            <strong>Mehmet DOĞAN</strong><br />
            <sub>Software Engineer</sub><br /><br />
            <div>
              <a href="https://github.com/mehmetdogandev" aria-label="Mehmet DOĞAN GitHub" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=white" alt="GitHub" /></a>
              &nbsp;
              <a href="https://www.linkedin.com/in/mehmetdogandev/" aria-label="Mehmet DOĞAN LinkedIn" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?logo=linkedin&logoColor=white" alt="LinkedIn" /></a>
              &nbsp;
              <a href="https://www.instagram.com/mehmetdogandev" aria-label="Mehmet DOĞAN Instagram" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/badge/Instagram-E4405F?logo=instagram&logoColor=white" alt="Instagram" /></a>
            </div>
          </td>
        </tr>
      </table>
    </td>
    <td width="50%" valign="top" align="center">
      <table width="100%" cellspacing="0" cellpadding="10">
        <tr>
          <td width="92" align="center" valign="top">
            <a href="https://github.com/abdulsametok" aria-label="Abdulsamet OK GitHub Profile" target="_blank" rel="noopener noreferrer">
              <img src="https://avatars.githubusercontent.com/u/126724879?v=4" alt="Abdulsamet OK avatar" width="84" height="84" />
            </a>
          </td>
          <td valign="top">
            <strong>Abdulsamet OK</strong><br />
            <sub>Software Engineer</sub><br /><br />
            <div>
              <a href="https://github.com/abdulsametok" aria-label="Abdulsamet OK GitHub" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=white" alt="GitHub" /></a>
              &nbsp;
              <a href="https://www.linkedin.com/in/abdulsamet-ok-392664268/" aria-label="Abdulsamet OK LinkedIn" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?logo=linkedin&logoColor=white" alt="LinkedIn" /></a>
              &nbsp;
              <a href="https://www.instagram.com/a.sametok" aria-label="Abdulsamet OK Instagram" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/badge/Instagram-E4405F?logo=instagram&logoColor=white" alt="Instagram" /></a>
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</div>
