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
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

`npm run check` runs the push-blocking checks. Husky runs staged linting before commits, Commitlint validates commit messages, and the full check suite runs before pushes.

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
