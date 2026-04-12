package com.woodcert.auction.core.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Email verification configuration.
 * Used to build verification links and control token lifetime.
 */
@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "identity.email-verification")
public class EmailVerificationProperties {

    /**
     * Base URL of the verification endpoint.
     * Example: http://localhost:8080/api/v1/auth/verify-email
     */
    private String verificationLinkBaseUrl = "http://localhost:8080/api/v1/auth/verify-email";

    /**
     * Sender address used when SMTP is configured.
     */
    private String fromAddress = "no-reply@woodcert.local";

    /**
     * Subject line of verification emails.
     */
    private String subject = "Verify your WoodCert email";

    /**
     * Raw verification token lifetime in seconds.
     */
    private long tokenTtlSeconds = 900;

    /**
     * Minimum delay between resend requests for the same account, in seconds.
     */
    private long resendCooldownSeconds = 60;
}
