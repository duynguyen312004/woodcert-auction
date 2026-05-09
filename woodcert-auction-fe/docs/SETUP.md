# Setup

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker Desktop

## Planned Local Environment

Frontend will use these environment variables:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_WS_BASE_URL=http://localhost:8080/ws-auction
VITE_CLOUDINARY_UPLOAD_TIMEOUT_MS=60000
```

## Package Manager

Use `pnpm` as the official package manager.

Expected commands after scaffold:

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

The FE is expected to run against the local backend in `woodcert-auction`.

Required backend capabilities:

- REST API at `VITE_API_BASE_URL`
- websocket endpoint at `VITE_WS_BASE_URL`
- credentialed CORS for the FE origin
- refresh-cookie support

## Docker Strategy

Planned production image:

1. build stage using Node + pnpm
2. runtime stage using nginx
3. serve static Vite output with SPA route fallback

Planned Docker files:

- `Dockerfile`
- `.dockerignore`
- optional `docker-compose.yml` for local FE-only or FE+BE orchestration
- `nginx.conf`

## Notes

- The FE scaffold follows the stack and folder rules defined in:
  - [ARCHITECTURE.md](ARCHITECTURE.md)
  - [PROJECT-RULES.md](PROJECT-RULES.md)
