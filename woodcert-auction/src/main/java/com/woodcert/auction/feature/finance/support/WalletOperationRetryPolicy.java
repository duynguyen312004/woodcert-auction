package com.woodcert.auction.feature.finance.support;

import com.woodcert.auction.core.exception.ErrorCode;

import java.util.Set;

/**
 * Classifies persisted wallet failures that are safe to retry with the same
 * business operation key.
 */
public final class WalletOperationRetryPolicy {

    private static final Set<String> RETRYABLE_FAILURE_CODES = Set.of(
            ErrorCode.WALLET_INSUFFICIENT_AVAILABLE_BALANCE.name(),
            ErrorCode.WALLET_INSUFFICIENT_FROZEN_BALANCE.name(),
            ErrorCode.WALLET_CONCURRENT_MODIFICATION.name()
    );

    private WalletOperationRetryPolicy() {
    }

    public static boolean isRetryable(String failureCode) {
        return failureCode != null && RETRYABLE_FAILURE_CODES.contains(failureCode);
    }
}
