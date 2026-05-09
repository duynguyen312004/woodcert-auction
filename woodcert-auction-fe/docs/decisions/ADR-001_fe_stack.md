# ADR-001: Frontend Stack and Architecture Baseline

## Status

Accepted

## Context

The backend already provides:

- REST APIs with wrapped `ApiResponse<T>` responses
- JWT auth with refresh flow
- wallet and auction business flows
- websocket auction broadcasts
- direct-to-Cloudinary media upload flow

The frontend needs:

- strong API contract handling
- controlled auth refresh and retry behavior
- reliable realtime UX for auction rooms
- scalable structure for buyer, seller, appraiser, and later admin workflows

## Decision

The FE baseline will use:

- React + TypeScript
- Vite
- hybrid feature-first structure
- React Router
- TanStack Query for server state
- Zustand for small auth/UI state
- Axios with interceptors for auth refresh and retry
- Tailwind CSS + shadcn/ui
- SockJS + STOMP for auction realtime
- pnpm
- Docker multi-stage build with nginx runtime

## Rationale

### TypeScript

The project has many DTO-like contracts and role-based flows. Type safety reduces contract drift and refactor risk.

### Hybrid Feature-First

Pure flat folders do not scale cleanly across buyer, seller, and appraiser workflows. A hybrid feature-first structure keeps feature ownership strong while still allowing shared infrastructure in `app/` and `shared/`.

### TanStack Query + Zustand

Server state and client-only state should not be mixed. Query is strong for remote state, retries, invalidation, and reconciliation. Zustand is sufficient for small auth and UI state without imposing a larger global-state model.

### Axios

The system needs a hard decision on `401 -> refresh -> retry`. Axios interceptors provide a clearer and lower-friction solution than building a custom fetch wrapper with request replay and refresh queuing from scratch.

### Tailwind + shadcn/ui

This gives fast implementation with reusable primitives while still allowing the project to build its own visual identity instead of staying at generic defaults.

### Docker + nginx

The FE is a static SPA. Serving the build through nginx keeps runtime simple and production-appropriate.

## Consequences

- FE docs and later scaffold must follow the locked stack unless a new ADR replaces this one.
- Route composition, Axios behavior, websocket lifecycle, and clock sync are now architectural standards, not implementation preferences.
- Admin support remains structurally planned through `features/admin` but is deferred in scope.
