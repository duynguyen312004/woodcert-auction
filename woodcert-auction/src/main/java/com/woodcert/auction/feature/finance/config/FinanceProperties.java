package com.woodcert.auction.feature.finance.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.math.BigDecimal;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "finance")
public class FinanceProperties {

    private final Wallet wallet = new Wallet();
    private final Platform platform = new Platform();



    public Duration getWalletOperationPendingTimeout() {
        return wallet.getOperation().getPendingTimeout();
    }

    public BigDecimal getAppraisalFee() {
        return platform.getAppraisalFee();
    }

    public BigDecimal getForfeitedDepositPlatformRate() {
        return platform.getForfeitedDepositPlatformRate();
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

    @Getter
    @Setter
    public static class Platform {
        private BigDecimal appraisalFee = new BigDecimal("1000000.00");
        private BigDecimal forfeitedDepositPlatformRate = new BigDecimal("0.10");
    }
}
