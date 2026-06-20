# Google Drive Releases

Google Drive release configuration is retained for possible future use. The
active release flow currently uses Cloudflare R2; see
[RELEASES_R2.md](./RELEASES_R2.md).

If Google Drive support is re-enabled, keep its local env file at:

```text
envs/.env.drive
```

Use the template:

```text
envs/.env.drive.example
```

Expected values:

```text
GOOGLE_DRIVE_FOLDER_ID=your-parent-drive-folder-id
GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\service-account.json
```

Credential setup summary:

1. Create or select a Google Cloud project.
2. Enable the Google Drive API.
3. Create a service account.
4. Create a JSON key for that service account.
5. Create a parent folder in Google Drive.
6. Share that folder with the service account email as Editor.

Security notes:

- Never commit `envs/.env.drive`.
- Never commit the service account JSON file.
- Delete and recreate the service account key if it leaks.
