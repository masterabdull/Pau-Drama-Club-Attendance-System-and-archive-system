# PAU Drama Club systems

The app is a Next.js application with two data modes:

- `DATA_BACKEND=local` uses `data/local-db.json` for local demos only.
- `DATA_BACKEND=prisma` uses the Prisma schema and `DATABASE_URL` for real deployments.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Set `DATA_BACKEND=local` for a quick local demo, or use Prisma with `DATA_BACKEND=prisma` and a database URL.
4. Run `npm run dev`.
5. Open `http://localhost:3000` and create the first administrator account.

No sample members, meetings, attendance, or archive records are seeded. The dashboard metrics come only from records created through the app.

## Prisma deployment

1. Create a managed PostgreSQL database, for example on Neon, Supabase, or Railway. The Prisma schema is already configured for PostgreSQL.
2. Set `DATA_BACKEND=prisma` and create a long random `SESSION_SECRET`. The application allowlist permits only `rajab.umar@pau.edu.ng` and `masterabdulelumar@gmail.com` to use the Super Admin role.
3. Set `DATABASE_URL` to the provider connection string and run `npx prisma migrate dev --name initial` locally. Commit the generated `prisma/migrations` folder.
4. Run `npm run build` and `npm start` or deploy through the platform's Next.js integration.

## Vercel launch

1. Push the project to GitHub, GitLab, or Bitbucket.
2. In Vercel, choose **Add New Project**, import the repository, and keep the detected Next.js framework settings.
3. Add `DATABASE_URL`, `SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`, `DATA_BACKEND=prisma`, and `BLOB_READ_WRITE_TOKEN` under Project Settings > Environment Variables. Create the Blob token from Vercel Storage > Blob.
4. Use a hosted PostgreSQL database. Do not use the local SQLite file or `data/local-db.json` on Vercel.
5. After the role enum change, create and commit a migration with `npx prisma migrate dev --name update-club-roles`, then use a deployment command such as `npx prisma generate && npx prisma migrate deploy && next build`.
6. Deploy, open the generated URL, and create the first Super Admin account. Then use **Access** to create approved email accounts and assign roles.

When `BLOB_READ_WRITE_TOKEN` is present, archive files are stored as private Vercel Blob objects and downloads still pass through the app's role checks. Without the token, local development falls back to `ARCHIVE_STORAGE_DIR`.

The attendance dashboard includes a real session trend chart and a meeting-type comparison chart. They remain empty until attendance sessions are recorded; no placeholder values are inserted.

The current archive implementation writes files to `ARCHIVE_STORAGE_DIR`. Use a persistent mounted volume for a traditional server. Serverless hosting needs an object-storage adapter such as S3, Cloudflare R2, or Supabase Storage before production uploads are enabled.

## Custom domain and favicon

The favicon is already served from `app/icon.svg`. Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS domain so metadata uses the correct canonical origin. Add that domain in the hosting provider, then create the DNS records it provides. Replace the placeholder in `public/CNAME` only when deploying to a host that uses a CNAME file, and replace it with the actual domain.

## Security checklist

- Keep `.env`, `.env.local`, database files, and archive storage out of version control.
- Use HTTPS and a strong production session secret.
- Restrict database and object-storage credentials to the deployed service.
- Configure automated database and file backups.
- Test restricted archive downloads with each role before launch.