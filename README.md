# Parts Inspection Report Generator — Backend

A REST API where quality engineers upload part-inspection files (CSV/JSON) and receive an **AI-generated defect analysis report**. Uploads return immediately; the analysis runs in the background and the engineer polls for the result.

## Stack

- **NestJS 11** on the **Fastify** adapter, TypeScript
- **Prisma 7** + **PostgreSQL** (driver adapter `@prisma/adapter-pg`)
- **BullMQ** + **Redis** for background processing
- **LangChain** + **Google Gemini** for the AI analysis
- **JWT** (raw `@nestjs/jwt` + `bcrypt`) for auth
- **Swagger / OpenAPI** at `/api/docs`
- **Jest** for unit tests

## AI provider: Google Gemini (why)

I chose **Google Gemini** (`gemini-2.5-flash`) via `@langchain/google`:

- Free API key from [aistudio.google.com](https://aistudio.google.com), no credit card, generous free tier.
- First-class **structured output** — `model.withStructuredOutput(zodSchema)` forces the model to return an object matching a Zod schema, so the report shape (summary / defects / recommended action) is guaranteed and parse failures are caught automatically.
- Routed through LangChain, so swapping to Ollama or OpenRouter later means changing one line in `AgentService` — the schema, prompts, and worker stay the same.

The AI genuinely runs; there is no hardcoded/mocked response.

---

## Prerequisites

- **Node 20+** and **Yarn 4** (`packageManager` is pinned in `package.json`)
- **PostgreSQL** running locally (or reachable via `DATABASE_URL`)
- **Redis** running locally (BullMQ)
- **Bun** — used only to run the TypeScript seed script
- A **Gemini API key**

> Note: a `docker-compose.yml` is **not** included yet — Postgres and Redis are expected to be running locally. See `DECISIONS.md` §5.

## Setup

```bash
# 1. install deps
yarn install

# 2. create .env (see below)

# 3. apply the database schema
yarn dlx prisma migrate deploy

# 4. seed two users (uses bun; ts-node cannot resolve the generated client)
bun prisma/seed.ts
```

### `.env`

```env
NODE_ENV=development
PORT=3000

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lmesh-be?schema=public"

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=change-me-in-prod
JWT_EXPIRES_IN=1h

GEMINI_API_KEY=your-real-gemini-key   # required — the app starts but analysis fails if empty
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TEMPERATURE=0
```

## Run

```bash
yarn start:dev      # watch mode
# or
yarn start          # one-off
```

App listens on `http://localhost:3000`. All routes are under the **`/api`** prefix.

## API docs

Swagger UI: **`http://localhost:3000/api/docs`** (enabled only when `NODE_ENV=development`).
Click **Authorize**, paste the `access_token` from login, then call the protected endpoints.

## Seeded users

| username | password      |
|----------|---------------|
| `alice`  | `password123` |
| `bob`    | `password123` |

---

## Endpoints

| Method | Path                   | Auth | Description                                   |
|--------|------------------------|------|-----------------------------------------------|
| POST   | `/api/auth/login`      | —    | Log in, returns a JWT access token            |
| POST   | `/api/reports/analyze` | JWT  | Upload a CSV/JSON file, queue analysis (async)|
| GET    | `/api/reports`         | JWT  | List your reports, optional `?status=` filter |
| GET    | `/api/health`          | —    | Health check                                  |

### Response envelopes

```jsonc
// success
{ "data": { ... }, "message": "..." }
// error
{ "message": "...", "code": "INVALID_CREDENTIALS", "errors": { "field": ["..."] } }
```

---

## End-to-end example (curl)

```bash
# 1. log in -> copy the access_token
curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"username":"alice","password":"password123"}'
# => { "data": { "access_token": "eyJ..." }, "message": "Login successful" }

TOKEN="eyJ..."   # paste the token

# 2. upload an inspection file (async) -> returns reportId / analysisId / PENDING
curl -s -X POST http://localhost:3000/api/reports/analyze \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@examples/inspection-defects.json" \
  -F "partNumber=GSK-4410-C" \
  -F "plantCode=PL-MONTERREY-03"

# 3. poll for the result — status goes PENDING -> PROCESSING -> FINISHED (or FAILED)
curl -s http://localhost:3000/api/reports -H "Authorization: Bearer $TOKEN"
```

Sample inspection files are in [`examples/`](./examples): a clean part, a part with defects,
a critical failure, and an invalid-data file that exercises the fast-fail path.

## Tests

```bash
yarn test        # unit tests
yarn test:cov    # with coverage
```

Covers the critical logic paths: login/JWT, the guard, report submission + queueing,
the analysis worker (success, retry, unrecoverable failure), and the data-access layer.

## Resilience summary

- Failed AI calls retry **3× with exponential backoff** (2s base).
- Unanalyzable input fast-fails (no wasted retries).
- A permanently failed report is stored as `status = FAILED` with the reason in the `error`
  column and an `errorCount` — all visible via `GET /api/reports`.

See **`DECISIONS.md`** for the architecture decision record.
