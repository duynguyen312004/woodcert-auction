package com.woodcert.auction.feature.identity.service;

import java.util.List;

public record IssuedAuthTokens(
        String accessToken,
        String rawRefreshToken,
        List<String> roles
) {
}
