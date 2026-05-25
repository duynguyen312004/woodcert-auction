package com.woodcert.auction.feature.catalog.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "catalog")
public class CatalogProperties {

    private final Appraisal appraisal = new Appraisal();

    public Duration getAppraisalClaimTimeout() {
        return appraisal.getClaimTimeout();
    }

    @Getter
    @Setter
    public static class Appraisal {
        private Duration claimTimeout = Duration.ofHours(24);
    }
}
