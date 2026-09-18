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

Port notes (all learned the hard way on this machine):

- **Always pass `--port 3000`.** Without it this Next 16 build picks a *random* free port
  (`npm run dev` alone produced 50095, 51403 and 57237 in one session).
- If a previous server was killed with `Stop-Process -Force`, its `.next/dev/lock` survives and the
  next start fails with *"Another next dev server is already running"* (or silently falls back to
  another port). Delete the lock first: `rm -f .next/dev/lock`.
- Only one dev server may run per directory, so temporarily swapping environments (e.g. to preview
  the bundled demo catalogue with empty Supabase keys) requires stopping the running server first.
- Read the actual `Local:` line from the log and confirm with `netstat -ano | grep ":3000"` before
  registering the preview.

```powershell
powershell -NoProfile -Command "(Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev','--','--port','3000' -RedirectStandardOutput '.freebuff\<preview-log>.log' -RedirectStandardError '.freebuff\<preview-log>.log.err' -WindowStyle Hidden -PassThru).Id"
```

- `npm.cmd` must be named exactly — Start-Process does not resolve shell shims.
- stdout and stderr go to DIFFERENT files; PowerShell fails if both point at one path.
- Then confirm it survived and answer:

```powershell
powershell -NoProfile -Command "Get-Process -Id <pid>"
curl -s -o /dev/null -w "%{http_code}" http://localhost:<port>/
```

Production check (optional): `npm run build` then `npm run start -- --port 3000`.

Note on re-registering a preview: `register_preview` with `replace: true` stops the currently
registered server. If that server was started by hand it comes back dead — restart it with the
recipe above before registering again. When the previous preview is already released, a plain
registration (no `replace`) is enough.

Environment: `.env` holds the real Supabase project keys. Emptying
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` switches the app to the bundled demo
catalogue, which is the only way to exercise the out-of-stock UI (demo data ships one
out-of-stock product).

Useful routes: `/` `/shop` `/product/premium-cotton-t-shirt` `/cart` `/checkout`
`/admin` (redirects to `/admin/login` until Supabase auth is configured).
