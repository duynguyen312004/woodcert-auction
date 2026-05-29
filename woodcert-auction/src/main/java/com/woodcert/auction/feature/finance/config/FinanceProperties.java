package com.woodcert.auction.feature.finance.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "finance")
public class FinanceProperties {

    private final Wallet wallet = new Wallet();



    public Duration getWalletOperationPendingTimeout() {
        return wallet.getOperation().getPendingTimeout();
    }

    @Getter
    @Setter
    public static class Wallet {
        private final Operation operation = new Operation();
    }

    @Getter
    @Setter
    public static class Operation {
        private Duration pendingTimeout = Duration.ofMinutes(5);
    }
}
