package com.woodcert.auction.feature.auction.entity;

/**
 * Status of a bid attempt.
 * VALID: accepted by Redis Lua script.
 * INVALID_PRICE: bid amount is less than current_price + step_price.
 * REJECTED_TIME: auction time has expired at the moment of Lua execution.
 */
public enum BidStatus {
    VALID,
    INVALID_PRICE,
    REJECTED_TIME
}
