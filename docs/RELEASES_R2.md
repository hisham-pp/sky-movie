# Cloudflare R2 Releases

Sky Movie's active desktop release flow uploads packaged desktop artifacts to
Cloudflare R2, updates `website/public/releases.json`, and commits that JSON so
the website download cards and `/whats-new` page update with the release.

Google Drive release configuration is still kept under `envs/.env.drive.example`
for possible future use, but R2 is the current release target.

## R2 Bucket Setup

1. In Cloudflare, open **R2 Object Storage**.
2. Create a bucket, for example:

   ```text
   sky-movie-releases
   ```

3. Create an R2 API token:
   - Open **R2 > Manage R2 API Tokens**.
   - Create a token with Object Read & Write access for the release bucket.
   - Copy the Access Key ID and Secret Access Key.

4. Configure public downloads:
   - Either connect a custom domain to the bucket, or enable a public bucket URL.
   - The release script uses this as `CLOUDFLARE_R2_PUBLIC_BASE_URL`.

## Local Env File

Copy the example:

```powershell
Copy-Item envs\.env.r2.example envs\.env.r2
```

Fill in:

```text
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_R2_BUCKET=sky-movie-releases
CLOUDFLARE_R2_ACCESS_KEY_ID=your-r2-access-key-id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
CLOUDFLARE_R2_PUBLIC_BASE_URL=https://downloads.example.com
CLOUDFLARE_R2_PREFIX=releases
```

`envs/.env.r2` is ignored by git.

## Release Commands

Upload already-built artifacts from `desktop-app/dist/`:

```powershell
pnpm run release:r2
```

Package first, then upload:

```powershell
pnpm run release:r2:package
```

Test without committing `website/public/releases.json`:

```powershell
pnpm run release:r2 -- --no-commit
```

Write curated What's New entries instead of generated git-log entries:

```powershell
pnpm run release:r2 -- --change "Added R2 release uploads" --change "Added What's New page"
```

## Versioned R2 Layout

The script uploads artifacts under a version prefix:

```text
<CLOUDFLARE_R2_PREFIX>/v<version>/<artifact-file>
```

Example:

```text
releases/v0.1.0/Sky Movie-0.1.0-x64-Setup.exe
```

## Website Automation

The script updates `website/public/releases.json` with:

- desktop version
- release date
- R2 bucket and object prefix
- public download URLs
- file sizes and SHA-256 hashes
- source commit SHA
- last commit message
- What's New entries

The website reads this JSON to render:

- homepage download cards
- `/whats-new`

By default, the script commits `website/public/releases.json`:

```text
chore(release): publish Sky Movie <version> downloads
```

Use `--no-commit` to skip that commit.

## Troubleshooting

If uploads fail with `403` or `SignatureDoesNotMatch`:

- Confirm `CLOUDFLARE_ACCOUNT_ID` is correct.
- Confirm the token belongs to R2 and has Object Read & Write permission.
- Confirm `CLOUDFLARE_R2_BUCKET` matches the bucket name exactly.
- Confirm your system clock is accurate.

If downloads return 404:

- Confirm `CLOUDFLARE_R2_PUBLIC_BASE_URL` points to the bucket's public URL or custom domain.
- Confirm the object exists under the generated `storagePrefix` in `website/public/releases.json`.
- Confirm the bucket/custom domain is public for downloads.
