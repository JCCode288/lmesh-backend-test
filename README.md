# Parts Inspection Report Generator

A REST API where quality engineers log in, upload a part-inspection file (CSV or JSON), and get back an AI-generated defect report. The upload returns immediately and the AI runs in the background — the engineer checks back later for the result.

## Stack

- NestJS 11 on the Fastify adapter, TypeScript
- Prisma 7 + PostgreSQL (via the `@prisma/adapter-pg` driver adapter)
- BullMQ + Redis for the background jobs
- LangChain + Google Gemini for the AI
- JWT auth (`@nestjs/jwt` + `bcryptjs`)
- Swagger at `/api/docs`, Jest for tests

## AI provider

I picked Google Gemini (`gemini-2.5-flash`) through `@langchain/google`. The key is free from [aistudio.google.com](https://aistudio.google.com) with no credit card. I route it through LangChain so the provider stays swappable, and I use `withStructuredOutput(zodSchema)` so the model must return an object matching my Zod schema — the report shape is guaranteed and bad output throws instead of silently passing. The AI genuinely runs; nothing is mocked.

## Run with Docker

The whole thing (app + Postgres + Redis) comes up with Compose. Copy `.env.example` to `.env.prod` and put your `GEMINI_API_KEY` in it (prior to running app, you should have generate this from google AI studio), then:

```bash
docker compose up --build
```

The database starts empty, so apply the schema and seed the users once (the DB port is published to the host):

```bash
npx prisma migrate deploy
bun prisma/seed.ts
```

App is on `http://localhost:3000`, all routes under `/api`.

## Run locally (without Docker)

You need Postgres and Redis running locally. Create `.env` (see below), then:

```bash
npm install
npx prisma migrate deploy
bun prisma/seed.ts        # ts-node can't resolve the generated client, so I use bun
npm run start:dev
```

## Seeded users

Both have the password `password123`:

- `alice`
- `bob`

## API

Swagger UI is at `http://localhost:3000/api/docs` (enabled when `NODE_ENV=development`). Click Authorize and paste the token from login.

| Method | Path | Auth | What it does |
|---|---|---|---|
| POST | `/api/auth/login` | no | Log in, returns a JWT |
| POST | `/api/reports/analyze` | yes | Upload a CSV/JSON file, queues analysis, returns immediately |
| GET | `/api/reports` | yes | List your own reports, optional `?status=` filter |
| GET | `/api/health` | no | Health check |

Responses use a standard envelope — success is `{ data, message? }`, error is `{ message, code, errors? }`.

## End-to-end example

```bash
# 1. log in and copy the access_token
curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"username":"alice","password":"password123"}'

TOKEN="paste-token-here"

# 2. upload a file — returns reportId / analysisId with status PENDING
curl -s -X POST http://localhost:3000/api/reports/analyze \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@examples/inspection-defects.json" \
  -F "partNumber=GSK-4410-C" \
  -F "plantCode=PL-MONTERREY-03"

# 3. poll — status goes PENDING -> PROCESSING -> FINISHED (or FAILED)
curl -s http://localhost:3000/api/reports -H "Authorization: Bearer $TOKEN"
```

Sample files live in [`examples/`](./examples): a clean part, one with defects, a critical failure, and an invalid-data file that triggers the fast-fail path.

## Tests

```bash
npm test
```

They cover the paths I consider most critical: login and the JWT guard, report submission plus queueing, the analysis worker (success, retry, and unrecoverable failure), and the data-access layer.

## Known limitations

- The single-report `GET /:id` and `DELETE` endpoints are not exposed yet (the repository method exists, so it's a thin add).
- Migrations are not run automatically inside the container — I run them manually after `docker compose up`.

See `DECISIONS.md` for the architecture reasoning.
