# Setup

Last updated: 2026-06-13

## Prerequisites

- Node.js 22.13+
- pnpm 11.x (`packageManager` currently pins `pnpm@11.0.9`)
- Docker Desktop if running backend dependencies through Docker

## Environment

Copy `.env.example` to `.env` when needed.

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_WS_BASE_URL=http://localhost:8080/ws-auction
VITE_CLOUDINARY_UPLOAD_TIMEOUT_MS=60000
```

## Commands

```bash
pnpm install
pnpm exec playwright install
pnpm dev
pnpm build
pnpm preview
pnpm test
pnpm test:e2e
```

For Linux or CI environments, Playwright browser dependencies may need:

```bash
pnpm exec playwright install --with-deps
```

## Backend Dependency

The FE expects the local backend in `../woodcert-auction`.

Required backend capabilities:

- REST API at `VITE_API_BASE_URL`
- WebSocket endpoint at `VITE_WS_BASE_URL`
- Credentialed CORS for the FE origin
- Refresh-cookie support
- Local profile with refresh cookie `Secure=false` when testing over plain HTTP

## Current Runtime Notes

- The app is a Vite static SPA.
- Production target remains static files served by nginx.
- Production Docker and SPA nginx files are available in the FE tree.
- Buyer bidding and seller auction monitoring use the shared SockJS/STOMP integration.
- Production Vite URLs are built as same-origin `/api/v1` and `/ws-auction`.

## Source Docs

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [PROJECT-RULES.md](PROJECT-RULES.md)
- [API_INTEGRATION.md](API_INTEGRATION.md)
- [PROJECT-STATUS.md](PROJECT-STATUS.md)
