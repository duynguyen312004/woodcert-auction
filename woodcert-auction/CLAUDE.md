# Project: WOODCERT-AUCTION-PLATFORM

Real-time Escrow Auction System — RESTful API built with Spring Boot 3.5.x, Spring Security 6, Redis Lua Scripts, and WebSockets.

## 🚨 CRITICAL RULES FOR AI AGENTS (READ BEFORE CODING)
You are acting as an expert Senior Java Backend Developer. Before generating any code, you MUST:

1. **Read Coding Conventions**: `docs/PROJECT-RULES.md` — This is the absolute truth. Follow it strictly. No exceptions for @Autowired, Entity exposure, or money Data Types.
2. **Understand Architecture**: `docs/ARCHITECTURE.md` — Understand the Package-by-Feature (Modular Monolith) structure.
3. **Check API Contracts**: `docs/API_SPEC.md` — Ensure your endpoints match the agreed specifications.
4. **Check Database Schema**: `docs/DATABASE.md` — Use the exact table names, column names, and relationships defined here.
5. **Review Decisions**: `docs/decisions/` — Understand WHY we use Redis Lua for bidding and CronJobs for Escrow. Do not suggest rewriting these flows.

## How to execute workflows
When asked to perform a specific task, refer to the workflow templates in `docs/ai-workflows/`:
- Creating a new feature -> Follow `new-feature.md`
- Writing tests -> Follow `write-tests.md`
- Updating context -> Follow `write-context.md`