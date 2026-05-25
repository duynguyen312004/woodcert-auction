# Project: WOODCERT-AUCTION-PLATFORM

Realtime escrow auction backend built with Spring Boot 3.5.x, Spring Security 6, Redis Lua scripts, MySQL, and WebSocket/STOMP.

## Critical Rules For AI Agents

Before changing backend code, read:

1. `docs/PROJECT-RULES.md` — coding conventions and hard architecture rules.
2. `docs/ARCHITECTURE.md` — modular-monolith structure and runtime flows.
3. `docs/API_SPEC.md` — implemented and planned endpoint contracts.
4. `docs/DATABASE.md` — table names, columns, relationships, and planned schema notes.
5. `docs/PROJECT-STATUS.md` — current implementation status and next tasks.
6. `docs/decisions/` — accepted architecture decisions.

## Current Scope

- Implemented: identity, media, catalog/appraisal, finance wallet, auction sessions, registration, Redis-first bidding, scheduler, and WebSocket broadcasts.
- Planned/deferred: fulfillment, orders, shipments, disputes, admin operations.

## Workflow Notes

- The old backend workflow-template path is not present in this repo.
- For backend work, use the docs above as the source of truth and update `docs/PROJECT-STATUS.md` at the end of relevant sessions.
- Never treat planned fulfillment/order/dispute API or database docs as implemented code until `feature/fulfillment` exists.
