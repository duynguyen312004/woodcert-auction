package com.woodcert.auction.feature.finance.service;

import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.feature.finance.dto.response.WalletRes;
import com.woodcert.auction.feature.finance.dto.response.WalletTransactionRes;
import com.woodcert.auction.feature.finance.entity.WalletReferenceType;
import com.woodcert.auction.feature.finance.support.FinanceOperationKey;

import java.math.BigDecimal;

public interface WalletService {

    WalletRes getMyWallet(String userId);

    PaginationResponse<WalletTransactionRes> getMyTransactions(String userId, int page, int size);

    void depositFunds(
            String userId,
            FinanceOperationKey operationKey,
            BigDecimal amount,
            Long referenceId,
            WalletReferenceType referenceType);

    void freezeFunds(
            String userId,
            FinanceOperationKey operationKey,
            BigDecimal amount,
            Long referenceId,
            WalletReferenceType referenceType);

    void unfreezeFunds(
            String userId,
            FinanceOperationKey operationKey,
            BigDecimal amount,
            Long referenceId,
            WalletReferenceType referenceType);

    void deductFrozenFunds(
            String userId,
            FinanceOperationKey operationKey,
            BigDecimal amount,
            Long referenceId,
            WalletReferenceType referenceType);

    void withdrawFunds(
            String userId,
            FinanceOperationKey operationKey,
            BigDecimal amount,
            Long referenceId,
            WalletReferenceType referenceType);
}
