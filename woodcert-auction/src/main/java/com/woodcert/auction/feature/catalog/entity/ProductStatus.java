package com.woodcert.auction.feature.catalog.entity;

/**
 * Status of a product through its lifecycle.
 * DRAFT → PENDING_APPRAISAL → APPRAISED or REJECTED
 */
public enum ProductStatus {
    DRAFT,
    PENDING_APPRAISAL,
    REJECTED,
    APPRAISED
}
