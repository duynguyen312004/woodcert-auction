package com.woodcert.auction.feature.identity.entity;

/**
 * User account status.
 * Stored as VARCHAR in DB via @Enumerated(EnumType.STRING).
 */
public enum UserStatus {
    ACTIVE,
    BANNED,
    UNVERIFIED
}
