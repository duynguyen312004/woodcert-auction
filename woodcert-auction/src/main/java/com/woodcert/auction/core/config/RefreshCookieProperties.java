package com.woodcert.auction.core.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Refresh-token cookie configuration properties bound from application.yaml.
 * Prefix: identity.refresh-cookie.*
 *
 * Allows the Secure flag to be disabled in local/dev profiles where
 * HTTPS is not available and the browser would silently reject Secure cookies.
 */
@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "identity.refresh-cookie")
public class RefreshCookieProperties {

    /**
     * Whether the cookie should be marked as Secure.
     * Must be true in production (HTTPS). Set to false for local HTTP development.
     */
    private boolean secure = true;

    /**
     * Cookie path. Must match the backend auth endpoint prefix so the browser
     * only sends the cookie on auth-related requests.
     */
    private String path = "/api/v1/auth";

    /**
     * Cookie max-age in seconds (default: 604800 = 7 days).
     * Should match or exceed the refresh token TTL.
     */
    private int maxAge = 604800;

    /**
     * SameSite policy for the refresh cookie.
     */
    private String sameSite = "Lax";
}
