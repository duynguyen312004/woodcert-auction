package com.woodcert.auction.feature.identity.service.seed;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "identity.location-seed")
public record LocationSeedProperties(
        boolean enabled,
        String apiUrl
) {
}
