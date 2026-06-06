package com.woodcert.auction.feature.finance.support;

/**
 * Canonical finance operation keys.
 *
 * Existing formats are intentionally preserved because persisted keys form part
 * of the idempotency contract.
 */
public final class FinanceOperationKeys {

    private static final char SEGMENT_SEPARATOR = ':';

    private FinanceOperationKeys() {
    }

    public static FinanceOperationKey appraisalSubmissionFee(Long productId, String sellerId) {
        return key("appraisal", "submit", "fee", id(productId, "productId"), segment(sellerId, "sellerId"));
    }

    public static FinanceOperationKey auctionRegistrationFreeze(Long auctionId, String userId) {
        return key("auction", "register", "freeze", id(auctionId, "auctionId"), segment(userId, "userId"));
    }

    public static FinanceOperationKey auctionWithdrawalRefund(Long auctionId, String userId) {
        return key("auction", "withdraw", "refund", id(auctionId, "auctionId"), segment(userId, "userId"));
    }

    public static FinanceOperationKey auctionCloseDeduct(Long auctionId, String userId) {
        return key("auction", "close", "deduct", id(auctionId, "auctionId"), segment(userId, "userId"));
    }

    public static FinanceOperationKey auctionCloseRefund(Long auctionId, String userId) {
        return key("auction", "close", "refund", id(auctionId, "auctionId"), segment(userId, "userId"));
    }

    public static FinanceOperationKey auctionCancelRefund(Long auctionId, String userId) {
        return key("auction", "cancel", "refund", id(auctionId, "auctionId"), segment(userId, "userId"));
    }

    public static FinanceOperationKey vnpayDeposit(String transactionReference) {
        return key("vnpay", segment(transactionReference, "transactionReference"));
    }

    public static FinanceOperationKey orderPayment(Long orderId, String buyerId) {
        return key("order", "pay", id(orderId, "orderId"), segment(buyerId, "buyerId"));
    }

    public static FinanceOperationKey orderForfeitSeller(Long orderId) {
        return key("order", "forfeit", "seller", id(orderId, "orderId"));
    }

    public static FinanceOperationKey orderForfeitPlatform(Long orderId) {
        return key("order", "forfeit", "platform", id(orderId, "orderId"));
    }

    public static FinanceOperationKey orderDisputeRefund(Long orderId) {
        return key("order", "dispute", "refund", id(orderId, "orderId"));
    }

    public static FinanceOperationKey orderCompletionPayout(Long orderId) {
        return key("order", "complete", "payout", id(orderId, "orderId"));
    }

    public static FinanceOperationKey orderCompletionCommission(Long orderId) {
        return key("order", "complete", "commission", id(orderId, "orderId"));
    }

    private static FinanceOperationKey key(String... segments) {
        return FinanceOperationKey.of(String.join(String.valueOf(SEGMENT_SEPARATOR), segments));
    }

    private static String id(Long value, String name) {
        if (value == null || value <= 0) {
            throw new IllegalArgumentException(name + " must be a positive identifier");
        }
        return value.toString();
    }

    private static String segment(String value, String name) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(name + " is required");
        }
        String normalized = value.trim();
        if (normalized.indexOf(SEGMENT_SEPARATOR) >= 0) {
            throw new IllegalArgumentException(name + " must not contain ':'");
        }
        return normalized;
    }
}
