Implement a new frontend feature for `woodcert-auction-fe`.

Read first:

1. `AGENTS.md`
2. `docs/ARCHITECTURE.md`
3. `docs/PROJECT-RULES.md`
4. `docs/API_INTEGRATION.md`
5. `docs/TESTING_STRATEGY.md`
6. `docs/PROJECT-STATUS.md`

Then follow this order:

1. Identify the owning feature folder under `src/features/`
2. Define feature routes if needed
3. Add or extend feature-local pages, components, hooks, and query/mutation hooks
4. Use shared Axios and shared Query conventions
5. Keep server state in TanStack Query and client-only state in Zustand only if necessary
6. Add tests using the official FE test stack
7. Update FE docs and `docs/PROJECT-STATUS.md` if behavior or scope changed

Hard rules:

- Do not invent a root-level `services/` or `pages/` architecture
- Do not replace Axios with raw fetch
- Do not use websocket as the sole source of truth
- Do not bypass the documented auth refresh flow
