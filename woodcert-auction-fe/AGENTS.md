# AGENTS

This frontend project uses the docs in `docs/` as the source of truth.

Before making any code change, read these files first:

1. `docs/ARCHITECTURE.md`
2. `docs/PROJECT-RULES.md`
3. `docs/API_INTEGRATION.md`
4. `docs/TESTING_STRATEGY.md`
5. `docs/PROJECT-STATUS.md`

## Project Baseline

- Stack: React + TypeScript + Vite
- Styling: Tailwind CSS + shadcn/ui
- Structure: hybrid feature-first
- Server state: TanStack Query
- Client-only state: Zustand
- HTTP client: Axios with centralized interceptors
- Realtime: SockJS + STOMP
- Package manager: pnpm
- Deploy target: Docker multi-stage build + nginx

## Mandatory Rules

- Keep `src/` aligned with the hybrid feature-first structure from `docs/ARCHITECTURE.md`.
- Do not create root-level `services/`, `pages/`, or `context/` as architecture primitives.
- Use one shared Axios client. Do not create ad hoc fetch wrappers or per-feature HTTP clients.
- Use TanStack Query for backend resource state. Do not mirror server state into Zustand.
- WebSocket is feature-scoped to the auction room lifecycle, not app-global.
- REST remains the source of truth. WebSocket may hot-patch cache, then must reconcile through refetch.
- Access token is memory-first. Respect `withCredentials: true` and backend refresh-cookie assumptions.
- Follow the test stack in `docs/TESTING_STRATEGY.md`: Vitest, React Testing Library, MSW, Playwright.
- Khi tạo file mới hoặc thêm logic quan trọng, thêm comment tiếng Việt ngắn gọn theo `docs/PROJECT-RULES.md`.

## Documentation Discipline

When architecture, integration, or workflow assumptions change:

- update the affected doc in `docs/`
- update `docs/PROJECT-STATUS.md`
- add or update an ADR in `docs/decisions/` if the stack or architecture baseline changes

## Preferred Workflow

- Use `.cursor/prompts/new-feature.md` for new feature work
- Use `.cursor/prompts/write-tests.md` for test work
- Use `.cursor/prompts/review-pr.md` for reviews
- Use `.cursor/prompts/update-status.md` at the end of a session
