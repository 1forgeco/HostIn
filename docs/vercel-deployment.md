# Deploying Hostin on Vercel

Hostin is a monorepo containing two deployable applications. Create two Vercel projects from the same GitHub repository; do not deploy the repository root as one project.

## 1. API project

Create or connect a PostgreSQL database first. A pooled production connection string is recommended for the serverless runtime.

Import the repository into Vercel and use these settings:

- Project name: `hostin-api`
- Root Directory: `server`
- Framework Preset: Express
- Install and framework settings: use `server/vercel.json`

Configure these variables for Production and Preview as appropriate:

```text
DATABASE_URL=postgresql://...
JWT_SECRET=<a random secret at least 32 characters long>
CLIENT_ORIGIN=https://<your-hostin-web-domain>
LOG_LEVEL=info
```

Apply migrations to the production database before serving traffic:

```bash
DATABASE_URL="postgresql://..." npm --prefix server run prisma:migrate:deploy
```

Seed the initial plans and demo accounts once, only if the deployment should contain demo data:

```bash
DATABASE_URL="postgresql://..." npm --prefix server run prisma:seed
```

After deployment, verify:

```text
https://<hostin-api-domain>/health
https://<hostin-api-domain>/ready
```

`/health` confirms the function is running. `/ready` confirms the database is reachable.

## 2. Web project

Import the same repository a second time with these settings:

- Project name: `hostin-web`
- Root Directory: `client`
- Framework Preset: Next.js
- Install and build settings: use `client/vercel.json`

Configure this variable for both Production and Preview:

```text
NEXT_PUBLIC_API_URL=https://<hostin-api-domain>/api
```

Redeploy the web project after changing this value because `NEXT_PUBLIC_*` values are included in the browser build.

## 3. Finish the connection

Once the web URL is known, set the API project's `CLIENT_ORIGIN` to that exact origin and redeploy the API. For custom domains, prefer sibling domains such as:

```text
https://hostin.example.com
https://api.hostin.example.com
```

Never commit `DATABASE_URL` or `JWT_SECRET`. Keep them in Vercel Environment Variables.
