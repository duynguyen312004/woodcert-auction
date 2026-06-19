# ADR-004: Modular Monolith Package Structure

## Status

Accepted and implemented. Updated 2026-06-19.

## Context

WoodCert Auction contains identity, media, catalog/appraisal, finance, realtime auction, order,
fulfillment, and dispute workflows. The project needs clear ownership boundaries without the
operational cost and distributed-transaction complexity of microservices.

## Options considered

### Option A: Package by technical layer

Top-level `controller`, `service`, `repository`, and `entity` packages.

Rejected because one business change would span many unrelated top-level directories and feature
ownership would be weak.

### Option B: Microservices

Independently deployed identity, auction, finance, order, and other services.

Rejected for the current scope because it would require service discovery or routing, distributed
observability, network-failure handling, and cross-service transaction design.

### Option C: Modular monolith, package by feature

One Spring Boot process and one MySQL schema, partitioned into cohesive feature packages.

Chosen.

## Decision

Use the following implemented package structure:

```text
com.woodcert.auction/
├── core/
└── feature/
    ├── identity/
    ├── media/
    ├── catalog/
    ├── finance/
    ├── auction/
    ├── order/
    ├── fulfillment/
    └── dispute/
```

This is a modular monolith, not a microservices architecture.

## Ownership rules

- `core` contains shared infrastructure and no feature business rules.
- Each feature owns its controllers, DTOs, entities, repositories, and business services.
- Controllers return DTOs, never JPA entities.
- Cross-feature consumers should prefer service interfaces, query snapshots, or ports/adapters.
- Order creation depends on `OrderSourceAdapter`; auction is the current source implementation.
- Fulfillment exposes snapshots through `OrderFulfillmentPort`.
- Dispute coordinates outcomes through order and fulfillment services rather than mutating finance
  repositories.
- New package cycles must not be introduced.

## Current accepted technical debt

- Some catalog flows still read identity repositories directly.
- Some dispute entities retain direct order/fulfillment associations.
- Order and fulfillment call each other through package-level ports and services inside the same
  process.

These are known modularity compromises, not evidence of separate services.

## Consequences

Positive:

- Cohesive feature navigation.
- One deployable artifact and simple local transactions.
- Explicit ownership for the complete implemented commerce flow.
- Selected boundaries can be refactored later if scale or organization requires it.

Negative:

- Package boundaries rely partly on engineering discipline.
- A single database allows accidental cross-module access if rules are ignored.
- Extraction into services would require deliberate redesign; package separation alone does not make
  extraction effortless.
