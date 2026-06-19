package com.woodcert.auction.feature.fulfillment.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "fulfillment")
public class FulfillmentProperties {
    private boolean schedulerEnabled = true;
    private Duration shipmentDeadline = Duration.ofDays(3);
    private String shipmentDeadlineCron = "0 */1 * * * *";
    private Duration autoCompleteAfter = Duration.ofDays(7);
    private String autoCompleteCron = "0 */5 * * * *";
}
