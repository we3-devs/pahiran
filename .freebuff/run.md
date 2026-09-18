# Run this project (Next.js 16 clothing store, Windows)

## Reproduce the artifacts

A fresh checkout needs two things before the dev server will start:

1. **Environment file** — copy `.env` (or `.env.example` if you have no real values) from the
   main checkout into the worktree root as `.env`. Do NOT symlink; copy and adapt values
   (ports, URLs) per worktree. With no Supabase keys present the site runs on the bundled
   demo catalogue (`src/lib/demo-data.ts`), which is fine for previewing.
2. **Dependencies** — the repo has no checked-in node_modules; install with npm:

   ```bash
   npm install
   ```

   (There is a `package-lock.json`; use npm, not pnpm/yarn.)

## Run the dev server (detached, survives the conversation)

Port note: Next 16 auto-selects a free port if it thinks the default is taken by a stale
dev-server lock, so read the actual "Local:" URL from the log before registering.

```powershell
powershell -NoProfile -Command "(Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev' -RedirectStandardOutput '.freebuff\<preview-log>.log' -RedirectStandardError '.freebuff\<preview-log>.log.err' -WindowStyle Hidden -PassThru).Id"
```

- `npm.cmd` must be named exactly — Start-Process does not resolve shell shims.
- stdout and stderr go to DIFFERENT files; PowerShell fails if both point at one path.
- Then confirm it survived and answer:

```powershell
powershell -NoProfile -Command "Get-Process -Id <pid>"
curl -s -o /dev/null -w "%{http_code}" http://localhost:<port>/
```

Production check (optional): `npm run build` then `npm run start -- --port 3000`.

Useful routes: `/` `/shop` `/product/premium-cotton-t-shirt` `/cart` `/checkout`
`/admin` (redirects to `/admin/login` until Supabase auth is configured).
