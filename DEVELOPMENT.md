# HostIn Development

## One-command setup

```bash
cp .env.example .env
docker compose up --build
```

Open `http://localhost:3000`. The API runs at `http://localhost:5001` and PostgreSQL is exposed at `localhost:5433` by default. Change `POSTGRES_PORT` in `.env` when another host port is preferred; containers continue to use PostgreSQL on internal port `5432`.

The database is migrated automatically. Demo data is opt-in:

```bash
SEED_DATABASE=true docker compose up --build
```

Never enable automatic seeding in production.

## Native setup

```bash
npm install
npm install --prefix server
npm install --prefix client
cp server/.env.example server/.env
cp client/.env.example client/.env
npx prisma migrate deploy --schema server/prisma/schema.prisma
npm run dev
```

## Required checks

```bash
npm run verify:push
```

This is not optional project etiquette: `.husky/pre-push` runs it automatically for every developer. It blocks the push when any of these fail:

- server and client linting with zero warnings;
- Prisma client generation from the committed schema on a clean checkout;
- server and client TypeScript checks;
- isolated API and React component tests;
- server and client production builds;
- pending database migrations applied to the configured development database;
- database-backed login, role routing, workspace authorization, and readiness tests;
- Chromium desktop and mobile browser journeys.

The database checks use `server/.env`. Before the first push, point `DATABASE_URL` at a disposable local development/test database. The verification command applies migrations and upserts the City Complex demo fixture; never point it at production.

For a faster inner loop while coding, use `npm test`. `npm run check` runs everything except database-backed and browser tests. Do not use either as a substitute for `npm run verify:push` before sharing a branch.

## Continuous integration and branch protection

`.github/workflows/quality-gate.yml` repeats the verification in a clean environment on every pull request and every push to `main`. It uses PostgreSQL 16, runs the browser suite against production server/client builds, and builds both production Docker images.

Repository administrators must mark these checks as required in branch protection:

- `Server, client, database, and browser tests`
- `Production container builds`

Disable direct pushes to `main` and require branches to be up to date before merging. Local hooks can be bypassed; required CI checks are the enforcement boundary.

When a test fails, fix the code or the test fixture. Do not delete assertions, add unconditional skips, lower coverage by moving logic out of tests, or use `--no-verify` to ship a known failure.

## Database safety

- Use a dedicated local/test PostgreSQL database.
- Run `prisma migrate deploy` in deployments; never `migrate dev` against production.
- Back up production before migrations and test every migration against a recent sanitized snapshot.
- Keep `.env` files out of Git. Rotate any credential that is accidentally committed.

## Production requirements

- Set a unique `JWT_SECRET` of at least 32 characters.
- Set exact comma-separated `CLIENT_ORIGIN` values.
- Use managed PostgreSQL backups and point-in-time recovery.
- Replace manual payment completion with a verified payment-gateway webhook.
- Move lost/found images from database data URLs to object storage.
- Configure HTTPS, error monitoring, log aggregation, and uptime alerts.

## Known dependency advisory

The current Next.js dependency includes a moderate PostCSS advisory. `npm audit fix --force` proposes an invalid downgrade to Next 9 and must not be used. Track the upstream Next.js/PostCSS release and upgrade through a reviewed pull request.
