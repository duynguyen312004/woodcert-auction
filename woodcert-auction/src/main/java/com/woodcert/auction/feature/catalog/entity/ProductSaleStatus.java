package com.woodcert.auction.feature.catalog.entity;

/**
 * Sale availability of a certified physical product.
 *
 * This is intentionally separate from ProductStatus, which only models appraisal
 * lifecycle. A product can be APPRAISED and still be AVAILABLE, IN_AUCTION, or SOLD.
 */
public enum ProductSaleStatus {
    AVAILABLE,
    IN_AUCTION,
    PENDING_ORDER,
    SOLD,
    RETURNED
}
