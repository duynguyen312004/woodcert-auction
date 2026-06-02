package com.woodcert.auction.feature.order.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "order")
public class OrderProperties {
    private boolean schedulerEnabled = true;
    private Duration paymentDeadline = Duration.ofDays(3);
    private String paymentDeadlineCron = "0 */1 * * * *";
}
