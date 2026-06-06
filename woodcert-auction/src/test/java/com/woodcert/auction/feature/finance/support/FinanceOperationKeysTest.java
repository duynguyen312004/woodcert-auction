package com.woodcert.auction.feature.finance.support;

import com.woodcert.auction.core.exception.ErrorCode;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FinanceOperationKeysTest {

    @Test
    void preservesExistingKeyFormats() {
        assertThat(FinanceOperationKeys.appraisalSubmissionFee(11L, "seller-1").value())
                .isEqualTo("appraisal:submit:fee:11:seller-1");
        assertThat(FinanceOperationKeys.auctionRegistrationFreeze(12L, "buyer-1").value())
                .isEqualTo("auction:register:freeze:12:buyer-1");
        assertThat(FinanceOperationKeys.auctionWithdrawalRefund(12L, "buyer-1").value())
                .isEqualTo("auction:withdraw:refund:12:buyer-1");
        assertThat(FinanceOperationKeys.auctionCloseDeduct(12L, "buyer-1").value())
                .isEqualTo("auction:close:deduct:12:buyer-1");
        assertThat(FinanceOperationKeys.auctionCloseRefund(12L, "buyer-2").value())
                .isEqualTo("auction:close:refund:12:buyer-2");
        assertThat(FinanceOperationKeys.auctionCancelRefund(12L, "buyer-2").value())
                .isEqualTo("auction:cancel:refund:12:buyer-2");
        assertThat(FinanceOperationKeys.vnpayDeposit("DEP-001").value())
                .isEqualTo("vnpay:DEP-001");
        assertThat(FinanceOperationKeys.orderPayment(13L, "buyer-1").value())
                .isEqualTo("order:pay:13:buyer-1");
        assertThat(FinanceOperationKeys.orderForfeitSeller(13L).value())
                .isEqualTo("order:forfeit:seller:13");
        assertThat(FinanceOperationKeys.orderForfeitPlatform(13L).value())
                .isEqualTo("order:forfeit:platform:13");
        assertThat(FinanceOperationKeys.orderDisputeRefund(13L).value())
                .isEqualTo("order:dispute:refund:13");
        assertThat(FinanceOperationKeys.orderCompletionPayout(13L).value())
                .isEqualTo("order:complete:payout:13");
        assertThat(FinanceOperationKeys.orderCompletionCommission(13L).value())
                .isEqualTo("order:complete:commission:13");
    }

    @Test
    void rejectsAmbiguousOrInvalidSegments() {
        assertThatThrownBy(() -> FinanceOperationKeys.appraisalSubmissionFee(0L, "seller-1"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> FinanceOperationKeys.appraisalSubmissionFee(1L, "seller:1"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> FinanceOperationKeys.vnpayDeposit(" "))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> FinanceOperationKey.of("x".repeat(FinanceOperationKey.MAX_LENGTH + 1)))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void classifiesOnlyRecoverableFailuresAsRetryable() {
        assertThat(WalletOperationRetryPolicy.isRetryable(
                ErrorCode.WALLET_INSUFFICIENT_AVAILABLE_BALANCE.name())).isTrue();
        assertThat(WalletOperationRetryPolicy.isRetryable(
                ErrorCode.WALLET_INSUFFICIENT_FROZEN_BALANCE.name())).isTrue();
        assertThat(WalletOperationRetryPolicy.isRetryable(
                ErrorCode.WALLET_CONCURRENT_MODIFICATION.name())).isTrue();
        assertThat(WalletOperationRetryPolicy.isRetryable(ErrorCode.UNCATEGORIZED.name())).isFalse();
        assertThat(WalletOperationRetryPolicy.isRetryable(null)).isFalse();
    }
}
