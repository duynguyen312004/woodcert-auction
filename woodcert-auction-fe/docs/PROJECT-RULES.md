# Project Rules

Coding conventions, architecture guidelines, and strict rules for the frontend.
This file is the FE source of truth.

Current status is tracked in `PROJECT-STATUS.md`; rules here apply to both implemented and pending FE flows.

## 0. Tech Stack

| Layer           | Technology               |
| --------------- | ------------------------ |
| Language        | TypeScript               |
| Framework       | React                    |
| Build           | Vite                     |
| Routing         | React Router             |
| Styling         | Tailwind CSS + shadcn/ui |
| Server State    | TanStack Query           |
| Client State    | Zustand                  |
| HTTP            | Axios                    |
| Realtime        | SockJS + STOMP           |
| Package Manager | pnpm                     |
| Deploy Runtime  | nginx in Docker          |

## 1. Architecture Rules

- The official structure is hybrid feature-first.
- `features/` is the main business structure.
- `app/` owns composition only.
- `shared/` contains only reusable infrastructure and primitives.
- `admin/` exists structurally but is deferred.
- `wallet` currently has only the balance hook/header integration; full wallet pages are pending.
- `seller` currently has product/profile flows; seller auction flows are placeholders until implemented.
- Do not introduce root-level `services/`, `pages/`, or `context/` as architecture primitives.

## 2. Folder Ownership

### `app/`

Allowed:

- router composition
- global providers
- layouts

Not allowed:

- feature business logic
- feature-specific data hooks
- feature-specific form logic

### `shared/`

Allowed:

- Axios client
- auth helpers
- realtime helpers
- time sync helpers
- reusable UI primitives
- shared utility functions
- shared types and constants

Not allowed:

- feature-specific DTO adapters
- feature-only components
- seller-only or bidder-only business logic

### `features/`

Each feature owns:

- route exports
- pages
- feature-local components
- feature hooks
- query hooks
- mutation hooks
- feature DTO mapping if needed

## 3. Routing Rules

- Every feature may expose its own route objects or route arrays.
- `app/router/` composes these exports into the final router tree.
- Cross-feature navigation must use shared route helpers or constants.
- Do not deep-import internal page components from one feature into another feature.

## 4. State Rules

### TanStack Query

Use Query for all backend resource state:

- lists
- details
- form-backed fetched data
- wallet state
- auction runtime state
- query invalidation and reconciliation

### Zustand

Use Zustand only for:

- access token
- auth/session flags
- minimal UI-only state

Do not mirror server state into Zustand.

## 5. Axios Rules

Use one shared Axios instance.

Required behavior:

- base URL from env
- auth header injection when access token exists
- `withCredentials: true` on authenticated/private flows
- centralized error normalization
- response interceptor for `401 -> refresh -> retry`

Refresh flow rules:

- only one refresh request may run at a time
- concurrent failed requests must wait for that refresh result
- replay pending requests after refresh succeeds
- prevent infinite retry loops
- if refresh fails, clear auth state and force logout or redirect

Do not build per-feature ad hoc HTTP clients.

## 6. API and DTO Rules

- FE must treat backend `ApiResponse<T>` as the wire contract.
- Query hooks should expose already-unwrapped business data where possible.
- Normalize backend errors into one shared FE error shape.
- Do not spread raw Axios response objects through features.

## 7. Auth and Security Rules

- Access token is memory-first.
- Do not persist access token by default in localStorage.
- FE assumes backend refresh support via `HttpOnly` cookie.
- FE sends `withCredentials: true` where required.
- Backend must support credentialed CORS for the FE origin.

CSRF rule:

- Because cookie-authenticated flows are used, backend must enforce a CSRF mitigation strategy for sensitive endpoints.
- Minimum acceptable documented mitigation is safe `SameSite` behavior.
- Stronger preferred mitigation is an explicit CSRF token strategy for refresh and authenticated mutations.

## 8. Realtime Rules

### Lifecycle

- Connect STOMP only inside auction detail or bidding room lifecycle.
- Disconnect on unmount.
- Do not keep a permanent idle websocket client at app level.

### Authority

- REST is the source of truth.
- WebSocket is used for fast UX updates and cache synchronization.
- Do not create a separate authoritative websocket state store.

### Cache Update

- `NEW_BID` may hot-patch query cache with `queryClient.setQueryData`.
- Hot patch is temporary and must be followed by background refetch.
- If refetched server state differs, Query replaces the temporary patch.

### Retry and Fallback

- STOMP client must auto-reconnect with controlled backoff.
- Reconnect success must trigger REST refetch of affected queries.
- If websocket is unavailable, degraded realtime UX is acceptable, but displayed authoritative state must still come from REST.

## 9. Time Rules

- Countdown logic must use synchronized server time, not raw client local time.
- Preferred offset formula is `offset = (serverTime + RTT/2) - localReceiveTime`.
- Use backend `Date` headers from normal responses when reliable.
- Anti-sniper `endTime` updates from REST or websocket must immediately replace local countdown anchors.

## 10. UI Rules

- Use Tailwind plus shadcn/ui primitives.
- Wrap primitives when project-specific styling or behavior needs standardization.
- Do not leave feature-critical UI in unstructured inline markup when it should be reusable.
- Loading, empty, and error states must be explicitly designed for every major screen.
- Auction room UX should prioritize responsiveness and clarity over decorative complexity.

## 11. Query Key Rules

Query keys must be:

- stable
- feature-prefixed
- serializable

Examples:

- `["auctions", "list", params]`
- `["auctions", "detail", auctionId]`
- `["wallet", "me"]`
- `["catalog", "product", productId]`

Do not build query keys from implicit global state.

## 12. Testing Rules

Required FE testing stack:

- Vitest
- React Testing Library
- MSW
- Playwright

Minimum coverage areas:

- Axios refresh and retry flow
- auth/session transitions
- websocket cache patch and reconciliation
- countdown and server-time offset logic
- media upload flow state machine
- seller auction form validation

## 13. Quy tắc chú thích

- File mới nên có comment ngắn ở đầu file để nói file đó dùng làm gì và nằm trong luồng nào.
- Component, hook, API client, mapper, route config, constants quan trọng nên có comment giải thích vai trò chính.
- Hằng số khó hiểu phải có comment nói rõ lý do tồn tại hoặc ngưỡng giá trị, ví dụ thời gian đếm ngược, status mapping, query key.
- Comment viết bằng tiếng Việt tự nhiên, ngắn gọn, tránh câu dài kiểu dịch máy.
- Không comment lại điều quá rõ như `setState`, render JSX đơn giản, import/export bình thường.
- Khi tạo file mới bằng AI, mặc định phải thêm comment theo các rule trên nếu file có logic hoặc là điểm nối quan trọng trong luồng.

## 14. Docker and Environment Rules

- Package manager is `pnpm`.
- Production runtime is static files behind nginx.
- No production Node runtime is assumed.
- `nginx.conf` must support SPA route fallback.
- Runtime env strategy must be documented clearly before implementation.

## 15. Final Rule

This FE is part of a financial and realtime auction system.

Code and docs must prioritize:

- contract clarity
- state consistency
- predictable data flow
- fast but correct UX
- explicit ownership between features and shared infrastructure
