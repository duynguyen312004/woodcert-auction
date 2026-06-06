package com.woodcert.auction.core.config;

import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.annotation.Validated;

/**
 * Configuration properties for login brute-force protection.
 */
@Getter
@Setter
@Validated
@Configuration
@ConfigurationProperties(prefix = "identity.brute-force")
public class BruteForceProperties {

    /**
     * Maximum number of failed login attempts allowed before locking.
     */
    @Min(1)
    private int maxAttempts = 5;

    /**
     * Lock duration in seconds.
     */
    @Min(1)
    private long lockDurationSeconds = 900;
}
