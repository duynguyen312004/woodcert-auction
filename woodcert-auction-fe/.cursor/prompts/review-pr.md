Review the frontend changes against `woodcert-auction-fe/docs/`.

Check these areas first:

## Architecture

- Is the code still hybrid feature-first?
- Did any business logic leak into `app/` or `shared/`?
- Are feature routes still feature-owned?

## State and Data

- Is TanStack Query used for backend data?
- Is Zustand limited to auth/session/UI flags?
- Is Axios still the only HTTP client path?
- Does `401 -> refresh -> retry` still follow the documented flow?

## Realtime

- Is websocket connection feature-scoped?
- Are websocket updates patching or invalidating Query cache rather than creating a parallel source of truth?
- Is reconnect followed by refetch?

## Security

- Are credentialed requests using `withCredentials: true` where required?
- Did any code weaken auth, CORS, CSRF, or token-handling assumptions?

## Testing

- Are new flows covered by Vitest/RTL/MSW/Playwright where appropriate?
- Were critical auction, auth, or time-sync behaviors changed without tests?

Return:

1. Blockers
2. Suggestions
3. Good parts
