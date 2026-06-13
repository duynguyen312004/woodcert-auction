package com.woodcert.auction.feature.finance.service;

import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.feature.finance.dto.response.WalletRes;
import com.woodcert.auction.feature.finance.dto.response.WalletTransactionRes;
import com.woodcert.auction.feature.finance.support.FinanceOperationKey;

import java.math.BigDecimal;

public interface WalletService {

    WalletRes getMyWallet(String userId);

    PaginationResponse<WalletTransactionRes> getMyTransactions(String userId, int page, int size);

    void topUpFromVnPay(String userId, FinanceOperationKey operationKey, BigDecimal amount, Long depositId);

    void chargeAppraisalFee(String userId, FinanceOperationKey operationKey, BigDecimal amount, Long productId);

    void freezeAuctionDeposit(String userId, FinanceOperationKey operationKey, BigDecimal amount, Long auctionId);

    void releaseAuctionDeposit(String userId, FinanceOperationKey operationKey, BigDecimal amount, Long auctionId);

    void captureAuctionDeposit(String userId, FinanceOperationKey operationKey, BigDecimal amount, Long auctionId);

    void payOrder(String userId, FinanceOperationKey operationKey, BigDecimal amount, Long orderId);

    void refundOrder(String userId, FinanceOperationKey operationKey, BigDecimal amount, Long orderId);

    void creditSellerPayout(String userId, FinanceOperationKey operationKey, BigDecimal amount, Long orderId);

    void creditSellerForfeitCompensation(
            String userId, FinanceOperationKey operationKey, BigDecimal amount, Long orderId);
}
