# Final Audit

## Scope

This audit reviews the current production comments SPA implementation against the assignment checklist, project engineering rules, and the verification commands run locally and through Docker.

## Verified Commands

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
docker compose up -d --build
docker compose exec api pnpm --filter @comments/api migration:run:prod
pnpm test:e2e
docker run --rm -v "${PWD}/tests/load:/scripts" -e API_BASE_URL=http://host.docker.internal:3000 -e K6_SMOKE=true grafana/k6:0.54.0 run /scripts/comments.js
```

## Assignment Coverage

- SPA comments flow: implemented with React and Vite.
- Backend: implemented with NestJS, TypeScript, TypeORM, and MySQL.
- Comments: top-level listing, LIFO default ordering, sorting, pagination, nested replies, preview, and WebSocket updates are implemented.
- Form fields: user name, e-mail, optional home page, CAPTCHA, text, and optional attachment are implemented.
- HTML policy: only `a`, `code`, `i`, and `strong` are allowed; unsupported HTML and malformed tag usage are rejected.
- Security: DTO validation, safe URL validation, HTML sanitization, SQL-shaped payload rejection tests, Helmet, throttling, CAPTCHA consumption, and JWT admin authentication are implemented.
- Attachments: JPG, PNG, GIF, and TXT validation is implemented; images are resized to fit 320x240; TXT size is limited.
- Persistence: SQL schema, TypeORM migration, and MySQL Workbench-readable schema export are present.
- Infrastructure: Docker Compose runs API, web, MySQL, Redis, RabbitMQ, and Elasticsearch.
- Async/search: Redis cache invalidation and Elasticsearch indexing through BullMQ are implemented and verified by Docker E2E.
- Load testing: k6 scenario and smoke report are present.

## Architecture Notes

The current shape is a modular monolith with clear NestJS modules for comments, users, CAPTCHA, files, security, cache, queue, messaging, realtime, and search. REST endpoints already fit the SPA nested comment flow, so GraphQL was not added because it would duplicate the same read model without improving the current client ergonomics.

## Remaining Production Hardening

- Run the full k6 ramping-arrival-rate scenario in a production-like environment with a defined CAPTCHA strategy and distributed client identity model.
- Tune rate limits separately for public CAPTCHA, comment creation, admin auth, and read-only endpoints.
- Add visual browser automation if the evaluation expects screenshots or full UI regression coverage.
- Add operational dashboards for queue latency, Elasticsearch indexing delay, WebSocket fanout, and cache hit ratio.
