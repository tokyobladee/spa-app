# Comments SPA

Comments SPA is a production-oriented threaded comments application. Users can create top-level comments, reply to any comment, attach supported files, preview formatted text, and receive live updates.

## Core Capabilities

- Threaded comments with unlimited replies.
- Top-level comment table with sorting by user name, e-mail, and creation date.
- Default LIFO ordering and 25-item pagination.
- Required user name, e-mail, CAPTCHA, and comment text fields.
- Optional home page and file attachment fields.
- Server-owned persistence for comments, user identity data, attachments, and operational metadata.
- Architecture prepared for queue processing, caching, events, JWT-protected flows, WebSocket updates, Elasticsearch indexing, and load testing.

## Stack

- TypeScript
- NestJS API
- React + Vite SPA
- TypeORM
- MySQL 8
- Redis
- RabbitMQ
- Elasticsearch
- Docker Compose
- Jest, Supertest, Playwright, and k6

## Getting Started

Install dependencies:

```bash
pnpm install
```

Create local environment configuration:

```bash
cp .env.example .env
```

Start infrastructure:

```bash
pnpm docker:up
```

Run database migrations:

```bash
pnpm --filter @comments/api migration:run
```

Start the applications:

```bash
pnpm dev
```

The API runs on `http://localhost:3000` and the SPA runs on `http://localhost:5173`.

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Run the Docker smoke load test:

```bash
docker run --rm -v "${PWD}/tests/load:/scripts" -e API_BASE_URL=http://host.docker.internal:3000 -e K6_SMOKE=true grafana/k6:0.54.0 run /scripts/comments.js
```

The load-test report is stored in `docs/load-test-report.md`.

## Database Schema

The MySQL schema export is stored in `database/schema.sql`.

## Deployment

Deployment notes are stored in `docs/deployment.md`.
