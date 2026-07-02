# Backend Technical Assessment — Parts Inspection Report Generator

**Role:** Senior Backend Engineer
**Time budget:** 3–5 days
**Submit to:** [TO FILL — email / Slack handle]

---

## Overview

Build a REST API that allows quality engineers to upload part inspection files and receive an AI-generated defect analysis report. There is no frontend — you are delivering the API that a frontend team will build against.

This is a realistic slice of the work you would ship in your first weeks at lmesh.

---

## AI Provider (Free — Your Choice)

You must integrate a real LLM. Use whichever free option suits you:

| Provider | How to get access |
|---|---|
| **Ollama** | `brew install ollama && ollama pull llama3.2` — fully local, no account needed |
| **OpenRouter** | [openrouter.ai](https://openrouter.ai) — free API key, free models available (e.g. `meta-llama/llama-3.1-8b-instruct:free`) |
| **Google Gemini** | [aistudio.google.com](https://aistudio.google.com) — free API key, `gemini-2.0-flash-lite` is free with no credit card |

The AI must genuinely respond. A hardcoded or mocked response does not count.

---

## Stack

- **Backend:** NestJS 11 (Fastify adapter), TypeScript, Prisma, PostgreSQL, Redis, Docker

Scaffold from scratch.

---

## What to Build

### Core user flow

1. A quality engineer logs in.
2. They **upload a part inspection file** (JSON or CSV) along with a part number and plant code.
3. The system analyses the file using an AI and produces a structured report containing: a summary of findings, a list of detected defects (each with a code, description, and severity), and a recommended action.
4. The engineer can **check the status** of their report at any time — analysis can take a while.
5. They can **list all their reports** and filter by status.
6. They can **delete a report** they no longer need.

### Important constraints

- Analysis takes time. The engineer should get an immediate response when they submit a file — they should not have to wait for the AI to finish before getting a response. They check back later for the result.
- The system should be resilient: if the AI call fails, the report should reflect that failure, and the engineer should be able to see what went wrong.
- Engineers can only see their own reports — not other users'.
- The system should not accept files of the wrong type or files that are too large.
- A health endpoint should exist so infrastructure can verify the service is up.

### What NOT to build

- No frontend of any kind
- No file storage to disk or cloud blob — store file content directly in the database
- No multi-tenancy or team management beyond "users see only their own reports"
- No email or push notifications

---

## Deliverables

- [ ] Git repository (public GitHub or shared link) with a readable commit history
- [ ] `README.md` — how to set up and run the service; which AI provider you chose and why; how to trigger a report end-to-end (curl example or Postman collection)
- [ ] `DECISIONS.md` — answers to the architecture questions below (required, not optional)
- [ ] The service runs end-to-end from `docker compose up` + seed
- [ ] Swagger docs at `/api/docs`
- [ ] Unit tests (at least 5) covering the logic paths you consider most critical
- [ ] Seed script creates at least two working users with credentials documented in the README

---

## Architecture Decision Record (Required)

Include a `DECISIONS.md` in the root of your repository. This is not optional — submissions without it are incomplete.

Answer each question in 3–8 sentences. Be specific: reference actual file paths, module names, or patterns from your code.

**1. Asynchronous processing**
Uploading a file returns immediately — the analysis happens later. How did you implement this? What does the flow look like from the moment a file is submitted to the moment the result is stored?

**2. AI integration**
How did you structure the AI call? What would need to change to swap to a different provider? How did you handle the case where the AI returns malformed or unparseable output?

**3. Resilience**
What happens when the AI call fails? How many times will the system retry, and why did you choose that number? How does an engineer know their report failed and why?

**4. Data access layer**
Walk through one concrete decision about how you organised your data access. What went in a repository vs. a service, and why?

**5. What you would do differently**
If you had two more days, what specific thing would you refactor or add — and why did you not do it in the time given?

---

## Conventions to Follow

These mirror lmesh's internal standards:

- **Files:** `kebab-case.type.ts` — e.g. `inspection-reports.processor.ts`
- **Classes:** `PascalCase`
- **Methods/variables:** `camelCase`
- **Routes:** plural, kebab-case — e.g. `/api/v1/inspection-reports`
- **Success responses:** `{ data: T, message?: string, code?: string }`
- **Error responses:** `{ message: string, code: ErrorCode, errors?: Record<string, string[]> }`
- **Exceptions:** only from `common/exceptions/` — never `throw new Error()` or raw `HttpException`
- **Logging:** `private readonly logger = new Logger(ClassName.name)`
- **TSDoc:** on all `public` methods
- **Commits:** conventional commits — `feat:`, `fix:`, `chore:`, `refactor:`, etc.
- **Swagger:** document all endpoints at `/api/docs` with request/response schemas
