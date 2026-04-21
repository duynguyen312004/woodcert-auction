package com.woodcert.auction.feature.finance.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.finance.config.FinanceProperties;
import com.woodcert.auction.feature.finance.entity.WalletOperation;
import com.woodcert.auction.feature.finance.entity.WalletReferenceType;
import com.woodcert.auction.feature.finance.entity.WalletTransactionStatus;
import com.woodcert.auction.feature.finance.entity.WalletTransactionType;
import com.woodcert.auction.feature.finance.repository.WalletOperationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class WalletOperationLifecycleService {

    private static final String STALE_PENDING_FAILURE_CODE = "STALE_PENDING_TIMEOUT";
    private static final String STALE_PENDING_FAILURE_MESSAGE = "Wallet operation remained pending past the configured timeout";
    private static final int FAILURE_MESSAGE_MAX_LENGTH = 255;

    private final WalletOperationRepository walletOperationRepository;
    private final FinanceProperties financeProperties;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public WalletOperation reserveOrReuseOperation(
            Long walletId,
            String operationKey,
            BigDecimal amount,
            WalletTransactionType transactionType,
            Long referenceId,
            WalletReferenceType referenceType) {
        WalletOperation existing = walletOperationRepository.findByOperationKey(operationKey).orElse(null);
        if (existing != null) {
            return handleExistingOperation(existing, walletId, amount, transactionType, referenceId, referenceType);
        }

        WalletOperation operation = new WalletOperation();
        operation.setOperationKey(operationKey);
        operation.setWalletId(walletId);
        operation.setAmount(amount);
        operation.setType(transactionType);
        operation.setReferenceId(referenceId);
        operation.setReferenceType(referenceType);
        operation.setStatus(WalletTransactionStatus.PENDING);

        try {
            return walletOperationRepository.saveAndFlush(operation);
        } catch (DataIntegrityViolationException ex) {
            WalletOperation duplicated = walletOperationRepository.findByOperationKey(operationKey)
                    .orElseThrow(() -> ex);
            return handleExistingOperation(duplicated, walletId, amount, transactionType, referenceId, referenceType);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markSuccess(Long operationId) {
        walletOperationRepository.findById(operationId).ifPresent(operation -> {
            if (operation.getStatus() != WalletTransactionStatus.PENDING) {
                return;
            }
            operation.setStatus(WalletTransactionStatus.SUCCESS);
            operation.setFailureCode(null);
            operation.setFailureMessage(null);
            walletOperationRepository.save(operation);
        });
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markFailed(Long operationId, String failureCode, String failureMessage) {
        walletOperationRepository.findById(operationId).ifPresent(operation -> {
            if (operation.getStatus() != WalletTransactionStatus.PENDING) {
                return;
            }
            operation.setStatus(WalletTransactionStatus.FAILED);
            operation.setFailureCode(normalizeFailureCode(failureCode));
            operation.setFailureMessage(truncateFailureMessage(failureMessage));
            walletOperationRepository.save(operation);
        });
    }

    private WalletOperation handleExistingOperation(
            WalletOperation existing,
            Long walletId,
            BigDecimal amount,
            WalletTransactionType transactionType,
            Long referenceId,
            WalletReferenceType referenceType) {
        boolean matches = existing.getWalletId().equals(walletId)
                && existing.getAmount().compareTo(amount) == 0
                && existing.getType() == transactionType
                && existing.getReferenceType() == referenceType
                && ((existing.getReferenceId() == null && referenceId == null)
                || (existing.getReferenceId() != null && existing.getReferenceId().equals(referenceId)));

        if (!matches) {
            throw new AppException(ErrorCode.WALLET_OPERATION_PAYLOAD_MISMATCH);
        }

        if (existing.getStatus() == WalletTransactionStatus.SUCCESS) {
            return null;
        }

        if (existing.getStatus() == WalletTransactionStatus.FAILED) {
            throw new AppException(ErrorCode.WALLET_OPERATION_ALREADY_FAILED);
        }

        if (isStalePending(existing)) {
            markFailed(existing.getId(), STALE_PENDING_FAILURE_CODE, STALE_PENDING_FAILURE_MESSAGE);
            throw new AppException(ErrorCode.WALLET_OPERATION_ALREADY_FAILED);
        }

        throw new AppException(ErrorCode.WALLET_OPERATION_IN_PROGRESS);
    }

    private boolean isStalePending(WalletOperation operation) {
        Instant touchedAt = operation.getUpdatedAt() != null ? operation.getUpdatedAt() : operation.getCreatedAt();
        if (touchedAt == null) {
            return false;
        }
        return touchedAt.plus(financeProperties.getWalletOperationPendingTimeout()).isBefore(Instant.now());
    }

    private String normalizeFailureCode(String failureCode) {
        if (failureCode == null || failureCode.isBlank()) {
            return ErrorCode.UNCATEGORIZED.name();
        }
        return failureCode.trim();
    }

    private String truncateFailureMessage(String failureMessage) {
        if (failureMessage == null || failureMessage.isBlank()) {
            return null;
        }
        String normalized = failureMessage.trim();
        if (normalized.length() <= FAILURE_MESSAGE_MAX_LENGTH) {
            return normalized;
        }
        return normalized.substring(0, FAILURE_MESSAGE_MAX_LENGTH);
    }
}
