# Deployment

## Target Shape

The application is designed to run as a Dockerized modular monolith with managed or self-hosted infrastructure:

- API container
- Web container
- MySQL 8
- Redis
- RabbitMQ
- Elasticsearch
- Persistent upload storage mounted into the API container

## VDS Deployment

1. Provision a Linux VDS with Docker Engine and Docker Compose.
2. Clone the repository.
3. Copy `.env.example` to `.env`.
4. Replace every secret and production endpoint in `.env`.
5. Create persistent volumes or host-mounted directories for MySQL, Redis, RabbitMQ, Elasticsearch, and uploads.
6. Run `docker compose up -d --build`.
7. Run migrations with `docker compose exec api pnpm --filter @comments/api migration:run`.
8. Put Nginx or a managed reverse proxy in front of the web and API services.
9. Enable HTTPS, request size limits, gzip or brotli, and health checks.

## Cloud Deployment

Use the same container boundaries on AWS, Azure, Google Cloud, Yandex Cloud, or another Docker-compatible platform. Prefer managed MySQL, Redis, RabbitMQ-compatible broker, Elasticsearch-compatible search, and object storage when the platform provides reliable managed services.

## Scale Notes

The 1,000,000 message and 100,000 user per 24-hour target depends on:

- indexed top-level comment pagination;
- parent-child traversal indexes;
- cache for hot first pages;
- queue-backed image processing and search indexing;
- dedicated Elasticsearch read model for search;
- WebSocket fanout separated from the database write transaction;
- load-test thresholds tracked before and after index or cache changes.

## Production Checks

Run these checks before handing the application to QA:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
docker compose up -d --build
pnpm --filter @comments/api migration:run
API_BASE_URL=https://your-domain.example k6 run tests/load/comments.js
```
