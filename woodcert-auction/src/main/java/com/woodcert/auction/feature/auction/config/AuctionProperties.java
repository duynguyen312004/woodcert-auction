package com.woodcert.auction.feature.auction.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "auction")
public class AuctionProperties {

    private final Scheduler scheduler = new Scheduler();
    private final Bidding bidding = new Bidding();
    private final Redis redis = new Redis();

    @Getter
    @Setter
    public static class Scheduler {
        private boolean enabled = true;
        private String activateCron = "*/5 * * * * *";
        private String closeCron = "*/5 * * * * *";
    }

    @Getter
    @Setter
    public static class Bidding {
        private Duration antiSniperThreshold = Duration.ofSeconds(30);
        private Duration antiSniperExtension = Duration.ofSeconds(60);
    }

    @Getter
    @Setter
    public static class Redis {
        private Duration stateRetentionAfterEnd = Duration.ofHours(24);
    }
}
