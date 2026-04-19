package com.woodcert.auction.feature.auction.entity;

/**
 * Lifecycle status of an auction session.
 */
public enum AuctionSessionStatus {
    WAITING,
    ACTIVE,
    ENDED_SUCCESS,
    ENDED_FAILED,
    CANCELED
}
