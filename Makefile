.PHONY: help setup dev build check test e2e migrate seed logs down reset-db

# List the available commands; use this when you are unsure what to run.
help:
	@printf '%s\n' \
		'make setup     First-time setup: create .env and start the Docker stack' \
		'make dev       Start the Docker stack in the foreground for development' \
		'make build     Build all Docker images without starting containers' \
		'make check     Run lint, type checks, unit/API tests, and production builds' \
		'make test      Run the server and client unit/API test suites' \
		'make e2e       Run browser tests against temporary local app servers' \
		'make migrate   Apply pending Prisma migrations using Docker' \
		'make seed      Insert or refresh local demo data using Docker' \
		'make logs      Follow client and server container logs' \
		'make down      Stop the Docker stack while preserving database data' \
		'make reset-db  Delete local Docker data and recreate a clean stack'

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

# Before pushing: run all static checks, tests, and production builds.
check:
	npm run check

# During development: run fast server and client tests without browser tests.
test:
	npm test

# Before pushing login/routing changes: run desktop and mobile browser tests.
e2e:
	npm run test:e2e

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
