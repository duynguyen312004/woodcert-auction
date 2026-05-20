# Architecture

> Frontend system design for WoodCert Auction. This file is the architectural source of truth for the FE app.

---

## Overview

The frontend will be a Vite-based React SPA that integrates with the verified backend in `woodcert-auction`.

Core principles:

- hybrid feature-first structure
- REST as the authoritative source of truth
- realtime updates for UX, not for final data authority
- strict separation between server state and client-only UI state
- production deployment as static assets behind nginx

## Stack

- React + TypeScript
- Vite
- React Router
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Zustand
- Axios
- SockJS + STOMP
- pnpm
- Docker + nginx

## High-Level Architecture

```text
Browser
-> React SPA
-> Axios API client
-> Spring Boot REST API
-> MySQL / Redis

Browser
-> STOMP over SockJS
-> /ws-auction
-> auction broadcast topics
```

## Source Structure

```text
src/
  app/
    router/
    providers/
    layouts/
  shared/
    api/
    auth/
    realtime/
    time/
    ui/
    hooks/
    lib/
    types/
    constants/
    config/
  features/
    auth/
    account/
    auction/
      api/
      components/
      hooks/
      routes.tsx
      types.ts
      index.ts
    bidding/
    wallet/
    catalog/
      api/
      components/
      hooks/
      routes.tsx
      index.ts
    home/
      components/
      pages/
      routes.tsx
    appraisal/
    seller/
    admin/        # deferred
  assets/
```

### Feature Ownership Notes

- `features/auction` owns all auction domain code: `ArtAuctionCard`, `AuctionListContent`, `usePublicAuctions`, types.
- `features/catalog` owns category domain: `CategoryFilter`, `useCategories`, `Category` type.
- `features/home` owns only landing page composition: `HomePage`, `HomeHero`, `FeaturedAuctionsSection`. It imports from auction and catalog — never the reverse.
- Cross-feature imports flow inward only: `home → auction`, `home → catalog`. Feature-to-feature dependencies in the other direction are not allowed.

### Ownership Rules

- `app/` composes the application.
- `shared/` contains only reusable cross-feature primitives and infrastructure.
- `features/` owns business workflows, pages, feature hooks, route exports, and feature-local components.
- `admin/` exists structurally from day one but is deferred.
- Root-level `services/`, `pages/`, or `context/` folders are not part of the official architecture.

## Routing Model

Each feature may expose route objects or route arrays through its own route module.

Example shape:

```ts
export const auctionRoutes = [
  {
    path: "/auctions",
    element: <AuctionListPage />,
  },
  {
    path: "/auctions/:auctionId",
    element: <AuctionDetailPage />,
  },
];
```

`app/router/` is only responsible for:

- composing feature route exports
- attaching layout wrappers
- attaching auth or permission guards
- building the final React Router tree

`app/router/` must not know internal feature implementation details.

## State Model

### Server State

Use TanStack Query for:

- REST data fetching
- cache storage
- invalidation
- background refetch
- mutation status
- reconciliation after websocket events

### Client State

Use Zustand only for:

- access token
- auth/session flags
- small UI state such as layout or modal preferences when needed

Do not copy backend resource state from Query into Zustand.

## HTTP Client Model

Use a single shared Axios instance.

Responsibilities:

- prepend `VITE_API_BASE_URL`
- inject access token when present
- use `withCredentials: true` for authenticated/private requests
- unwrap backend `ApiResponse<T>`
- normalize errors
- handle `401 -> refresh -> retry` through response interceptors

Concurrency rule:

- concurrent 401 responses must share one refresh operation
- pending requests are replayed after refresh succeeds
- refresh failure clears auth state and triggers consistent logout behavior

## Auth Model

Auth strategy:

- access token is memory-first
- refresh token is expected from backend as `HttpOnly` cookie and may also exist in the response body as fallback
- FE must support session recovery without persisting access tokens by default

Backend contract assumptions:

- `withCredentials: true`
- CORS credentials enabled
- explicit allowed FE origin
- backend CSRF mitigation for cookie-authenticated sensitive endpoints

## Realtime Model

### Connection Lifecycle

The websocket connection is feature-scoped.

- connect only when entering the auction detail or bidding room route
- disconnect when leaving that route
- no idle app-wide websocket connection outside realtime pages

### Event Handling

Subscribed topic:

```text
/topic/auctions/{auctionSessionId}
```

Expected event types:

- `SESSION_ACTIVATED`
- `NEW_BID`
- `SESSION_ENDED`

Rules:

- websocket events may hot-patch query cache for UX
- websocket events may invalidate and refetch queries
- websocket events do not replace REST as the final source of truth

### Retry and Fallback

- STOMP client must auto-reconnect with controlled backoff
- after reconnect succeeds, FE must refetch affected resources immediately
- if websocket stays unavailable, REST queries must still keep the UI correct

### Hot Cache Patch

For `NEW_BID`, FE may use `queryClient.setQueryData` to immediately patch:

- `currentPrice`
- `endTime`
- relevant auction detail cache
- relevant auction list cache

This is a temporary UX optimization only. Background refetch must still confirm server state.

## Clock Synchronization Model

Auction countdown must not trust local client time alone.

FE will track a server-time offset and calculate:

```text
serverNow = clientNow + offset
```

Preferred offset formula:

```text
offset = (serverTime + RTT/2) - localReceiveTime
```

Where feasible:

- use backend `Date` headers from normal API traffic
- continuously refine the offset
- do not rely on a dedicated sync endpoint unless needed later

If offset is stale or missing, FE should refetch before trusting long-lived countdowns.

## Media Upload Model

All uploads follow the same 4-step sequence:

1. request upload intent from backend
2. upload file directly to Cloudinary
3. confirm upload with backend using `mediaId` and `assetId`
4. attach confirmed `mediaId` through the relevant business form

The FE must reuse one common uploader architecture for avatar, product images, and appraisal proof images.

## Deployment Model

Production runtime:

- build with `pnpm`
- generate static Vite output
- serve static assets with nginx
- configure SPA fallback in `nginx.conf`

No production Node server is planned for FE runtime.
