package com.woodcert.auction.feature.identity.service;

public record RotatedAuthTokens(
        String accessToken,
        String rawRefreshToken
) {
}
