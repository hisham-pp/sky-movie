# Website

This folder contains the Sky Movie public website built with Next.js.

It is separate from the desktop MVP runtime and does not introduce a backend
dependency for the Electron app.

## Commands

```powershell
pnpm --filter @sky-movie/website dev
pnpm --filter @sky-movie/website typecheck
pnpm --filter @sky-movie/website build
```

## Deploy to Vercel

Sky Movie is a pnpm monorepo. Deploy only the `website/` package as the Vercel
project; the Electron desktop app is not part of the web deployment.

### Dashboard deployment

1. Push the repository to GitHub:

   ```powershell
   git remote -v
   git push origin main
   ```

2. In Vercel, create a new project and import:

   ```text
   https://github.com/hisham-pp/sky-movie
   ```

3. In the import settings, set:

   ```text
   Framework Preset: Next.js
   Root Directory: website
   Install Command: pnpm install
   Build Command: pnpm build
   Output Directory: leave default
   ```

4. Deploy. After the first deploy, every push to the connected branch creates a
   new production or preview deployment.

### CLI deployment

Install and log in to the Vercel CLI if needed:

```powershell
pnpm dlx vercel login
```

From the repository root, link the monorepo project:

```powershell
pnpm dlx vercel link --repo
```

When prompted, choose or create the Vercel project for `website/`. Then deploy:

```powershell
pnpm dlx vercel
```

Promote a production deployment:

```powershell
pnpm dlx vercel --prod
```

### Pre-deploy checks

Run these locally before pushing:

```powershell
pnpm --filter @sky-movie/website typecheck
pnpm --filter @sky-movie/website build
```

### Notes

- Vercel detects pnpm from `pnpm-lock.yaml` and the root `packageManager` field.
- Keep the Vercel project scoped to `website/` so desktop-only Electron code is
  not included in the web deployment.
- The deployed website reads static download metadata from
  `website/public/releases.json`; it does not need Cloudflare R2 credentials at
  runtime. R2 credentials stay local in `envs/.env.r2` for the release script.

References:

- [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Vercel monorepos](https://vercel.com/docs/monorepos)
- [Vercel package managers](https://vercel.com/docs/package-managers)
