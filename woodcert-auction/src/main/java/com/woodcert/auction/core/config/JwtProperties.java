package com.woodcert.auction.core.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * JWT configuration properties bound from application.yaml.
 * Prefix: jwt.*
 */
@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {

    /**
     * HMAC secret key for signing/verifying JWTs.
     */
    private String secretKey;

    /**
     * Access token expiration in seconds (default: 900 = 15 minutes).
     */
    private long accessTokenExpiration = 900;

    /**
     * Refresh token expiration in seconds (default: 604800 = 7 days).
     */
    private long refreshTokenExpiration = 604800;
}
