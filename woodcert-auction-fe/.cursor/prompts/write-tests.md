Write tests for the specified frontend behavior.

Read first:

1. `AGENTS.md`
2. `docs/TESTING_STRATEGY.md`
3. `docs/API_INTEGRATION.md`
4. `docs/PROJECT-RULES.md`

Test stack rules:

- Use Vitest for logic and hooks where appropriate
- Use React Testing Library for component behavior
- Use MSW for network mocking
- Use Playwright only for true end-to-end browser flows

Minimum expectations:

- auth refresh flow tests when Axios or auth behavior changes
- websocket cache patch plus refetch reconciliation when bidding UI changes
- countdown and server-time offset tests when auction time logic changes
- form validation tests when seller or appraisal forms change

Do not:

- mock away the exact behavior you are supposed to verify
- skip reconciliation tests for realtime features
