package com.woodcert.auction.core.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "identity.password-reset")
public class PasswordResetProperties {

    private String resetLinkBaseUrl = "http://localhost:5173/auth/reset-password";
    private String fromAddress = "no-reply@woodcert.local";
    private String subject = "Reset your WoodCert password";
    private long tokenTtlSeconds = 900;
    private long requestCooldownSeconds = 60;
}
