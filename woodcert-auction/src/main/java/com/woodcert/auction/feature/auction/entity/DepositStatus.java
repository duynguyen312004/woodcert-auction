package com.woodcert.auction.feature.auction.entity;

/**
 * Lifecycle of a participant's deposit in an auction session.
 * Phase 3.3 uses only FROZEN -> REFUNDED or FROZEN -> DEDUCTED.
 * CONFISCATED is reserved for fulfillment phase (winner non-payment).
 */
public enum DepositStatus {
    FROZEN,
    WITHDRAWN,
    REFUNDED,
    DEDUCTED,
    CONFISCATED
}
