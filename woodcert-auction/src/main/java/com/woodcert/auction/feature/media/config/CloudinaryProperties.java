package com.woodcert.auction.feature.media.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "cloudinary")
public class CloudinaryProperties {

    private String cloudName;
    private String apiKey;
    private String apiSecret;
    private boolean secure = true;
    private String baseFolder = "woodcert/dev";
    private final Cleanup cleanup = new Cleanup();
    private final Upload upload = new Upload();

    public boolean isConfigured() {
        return hasText(cloudName) && hasText(apiKey) && hasText(apiSecret);
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    @Getter
    @Setter
    public static class Cleanup {
        private boolean enabled = true;
        private String cron = "0 0 */6 * * *";
        private long stalePendingHours = 24;
        private int batchSize = 20;
        private int maxDeleteAttempts = 5;
    }

    @Getter
    @Setter
    public static class Upload {
        private long avatarMaxBytes = 5 * 1024 * 1024;
        private long imageMaxBytes = 10 * 1024 * 1024;
        private long videoMaxBytes = 100 * 1024 * 1024;
    }
}
