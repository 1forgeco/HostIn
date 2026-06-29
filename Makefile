.PHONY: help setup dev build check test test-client test-server test-integration e2e-prepare e2e e2e-public e2e-platform migrate seed logs down reset-db

# List the available commands; use this when you are unsure what to run.
help:
	@printf '%s\n' \
		'make setup             First-time setup: create .env and start the Docker stack' \
		'make dev               Start the Docker stack in the foreground for development' \
		'make build             Build all Docker images without starting containers' \
		'make check             Run the same full deployment gate used before every push' \
		'make test              Run all fast server/API and client component tests' \
		'make test-client       Run client component and theme bootstrap tests' \
		'make test-server       Run isolated API protection tests' \
		'make test-integration  Prepare demo data and run database authorization tests' \
		'make e2e-prepare       Apply migrations and refresh demo data for browser tests' \
		'make e2e               Run every desktop and mobile browser journey' \
		'make e2e-public        Run landing, plans, login, alias, and recovery journeys' \
		'make e2e-platform      Run tenant routing and 1Forge control-center journeys' \
		'make migrate           Apply pending Prisma migrations using Docker' \
		'make seed              Insert or refresh local demo data using Docker' \
		'make logs              Follow client and server container logs' \
		'make down              Stop the Docker stack while preserving database data' \
		'make reset-db          Delete local Docker data and recreate a clean stack'

# First clone only: preserve an existing .env and start everything in the background.
setup:
	@test -f .env || cp .env.example .env
	docker compose up --build -d

# Daily Docker development: start services and keep their logs attached.
dev:
	docker compose up --build

# CI/release check: build Docker images without starting the application.
build:
	docker compose build

# Before pushing: run static, unit, database, build, and browser deployment checks.
check:
	npm run verify:push

# During development: run every fast test without database integration or browsers.
test:
	npm test

# While changing React UI or theme bootstrapping: run client-side unit tests only.
test-client:
	npm --prefix client test

# While changing middleware, routes, or validation: run isolated API tests only.
test-server:
	npm --prefix server test

# After auth, organization, schema, or role changes: refresh demo data and test the database flow.
test-integration:
	npm run test:e2e:prepare
	npm run test:integration

# Browser tests depend on seeded demo users, roles, features, and platform data.
e2e-prepare:
	npm run test:e2e:prepare

# Before pushing any user journey change: run all desktop and mobile browser tests.
e2e: e2e-prepare
	npm run test:e2e

# While changing public pages: run landing, plans, login, aliases, and recovery routes.
e2e-public:
	npx playwright test e2e/public-journey.spec.ts

# While changing private workspaces or 1Forge: run routing and control-center coverage.
e2e-platform: e2e-prepare
	npx playwright test e2e/unified-login.spec.ts

# After schema changes: start PostgreSQL if needed and apply pending migrations.
migrate:
	docker compose run --rm --build server npx prisma migrate deploy

# For local demo testing: start dependencies if needed and populate sample data.
seed:
	docker compose run --rm --build server npm run prisma:seed

# While debugging Docker: continuously display API and frontend logs.
logs:
	docker compose logs -f client server

# When finished: stop containers but retain the local PostgreSQL volume.
down:
	docker compose down

# When local data is disposable: remove volumes and create a clean background stack.
reset-db:
	docker compose down -v
	docker compose up --build -d
