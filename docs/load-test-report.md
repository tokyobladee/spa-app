# Load-Test Report

## Environment

- Date: 2026-08-31
- Host: Windows with Docker Desktop and WSL 2 backend
- Stack: API, Web, MySQL 8.4, Redis 7.4, RabbitMQ 3.13, Elasticsearch 8.15.3
- Command:

```bash
docker run --rm -v "${PWD}/tests/load:/scripts" -e API_BASE_URL=http://host.docker.internal:3000 -e K6_SMOKE=true grafana/k6:0.54.0 run /scripts/comments.js
```

## Smoke Result

- Duration: 20 seconds
- VUs: 1
- Iterations: 20
- HTTP requests: 60
- Checks: 60/60
- HTTP failure rate: 0.00%
- HTTP duration p95: 24.99 ms
- Comment request duration p95: 5 ms

## Findings

The Docker stack handled the smoke profile cleanly with low latency. A previous 5 VU / 30 second run crossed the global 120 requests per minute throttling limit from a single source IP, producing expected 429 responses after the limit was exceeded. Full-scale testing should run with a dedicated load-test configuration that models distributed client IPs, explicit CAPTCHA strategy, and production rate-limit rules.

## Full-Scale Profile

The default k6 scenario in `tests/load/comments.js` keeps a ramping-arrival-rate profile intended for throughput exploration. It should be run against a production-like environment after deciding whether CAPTCHA is solved, bypassed through a dedicated internal test path, or modeled as an expected rejection path.

## Next Tuning Targets

- Validate MySQL indexes with high-cardinality users and comment trees.
- Measure Redis hit ratio for first-page comment reads.
- Track queue latency for attachment and search indexing jobs.
- Watch Elasticsearch indexing delay after write bursts.
- Measure WebSocket fanout separately from database writes.
