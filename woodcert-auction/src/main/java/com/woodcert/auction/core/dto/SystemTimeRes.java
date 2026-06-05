package com.woodcert.auction.core.dto;

import java.time.Instant;

public record SystemTimeRes(
        Instant serverTime,
        long epochMillis
) {
    public static SystemTimeRes now() {
        Instant now = Instant.now();
        return new SystemTimeRes(now, now.toEpochMilli());
    }
}
