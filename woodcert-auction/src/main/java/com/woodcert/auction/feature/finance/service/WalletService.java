package com.woodcert.auction.feature.finance.service;

import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.feature.finance.dto.request.TopUpWalletReq;
import com.woodcert.auction.feature.finance.dto.response.WalletRes;
import com.woodcert.auction.feature.finance.dto.response.WalletTransactionRes;
import com.woodcert.auction.feature.finance.entity.WalletReferenceType;

import java.math.BigDecimal;

public interface WalletService {

    WalletRes getMyWallet(String userId);

    PaginationResponse<WalletTransactionRes> getMyTransactions(String userId, int page, int size);

    WalletRes topUpWallet(String userId, TopUpWalletReq request);

    void depositFunds(
            String userId,
            String operationKey,
            BigDecimal amount,
            Long referenceId,
            WalletReferenceType referenceType);

    void freezeFunds(
            String userId,
            String operationKey,
            BigDecimal amount,
            Long referenceId,
            WalletReferenceType referenceType);

    void unfreezeFunds(
            String userId,
            String operationKey,
            BigDecimal amount,
            Long referenceId,
            WalletReferenceType referenceType);

    void deductFrozenFunds(
            String userId,
            String operationKey,
            BigDecimal amount,
            Long referenceId,
            WalletReferenceType referenceType);
}
