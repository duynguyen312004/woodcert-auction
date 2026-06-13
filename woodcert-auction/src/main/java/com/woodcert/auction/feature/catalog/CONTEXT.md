# Catalog Module

## Responsibility

`catalog` owns seller product inventory, categories, appraisal workflow, certificates, and product media relationships. Buyer marketplace reads are composed by `feature.auction`.

## Key Components

- Seller draft product create, update, delete, submit, detail, and statistics flows.
- Admin category CRUD and public category reads.
- Appraiser queue, claim/release, immutable reports, proof images, approval, and rejection.
- Certificate generation and public certificate verification.

## Boundary Rules

- Internal product list/detail endpoints are restricted to seller and appraiser workflows.
- Product images require exactly one primary image and full-replacement update semantics.
- Appraisal reports are immutable after submission.
- Auction owns marketplace DTO assembly; catalog supplies product-owned data and helpers.

## Lifecycle And Contracts

- Products move from `DRAFT` to appraisal states and then `APPRAISED` or `REJECTED`.
- Appraisal claims expire and become available for another appraiser.
- Approved reports store certificate code, integrity hash, proof images, and seller accuracy.
- Product sale status is updated by auction/order source callbacks.

## Known Limitations

- Category hierarchy is currently one level and exposed as a flat list.
- Some catalog/identity reads still use identity repositories directly and are tracked as modular technical debt.
