# Lesson 01: Repository skeleton

## Goal
Create a repository that cannot accidentally leak secrets, and get a reproducible PostgreSQL database running locally.

## Concepts
- **Ignore secrets first.** `.env` is ignored before any code exists, so a real key can never sneak into history. Only `.env.example` files are tracked.
- **Database in Docker.** Every developer gets the same Postgres version without installing it on their machine.
- **Bind to localhost.** The port is published on `127.0.0.1` only, so other machines on your network cannot reach the dev database.

## Files touched
- `.gitignore`
- `docker-compose.yml`

## Walkthrough
- `.gitignore:1-4`: ignores `.env` and `.env.*`, then re-allows `!.env.example`.
- `docker-compose.yml:10`: `127.0.0.1:${POSTGRES_PORT:-5433}:5432`. The host port defaults to 5433 to avoid clashing with a Postgres you may already have on 5432.
- `docker-compose.yml:13-17`: the healthcheck lets `docker compose up --wait` block until the database accepts connections.

**Why a dev password in the compose file?** It only protects a localhost-bound throwaway database, and it can be overridden with `POSTGRES_PASSWORD`. Production credentials never live in the repository.

## Run it
```bash
git checkout lesson-01
docker compose up -d --wait
docker compose ps
```

## Check yourself
`docker compose ps` shows the `db` service as `healthy`.

## Exercise
Change the host port to 5434 using only an environment variable (no file edits), and connect with `psql -h 127.0.0.1 -p 5434 -U taskflow taskflow`.
