
package com.woodcert.auction.feature.finance.service;

import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.finance.config.FinanceProperties;
import com.woodcert.auction.feature.finance.dto.response.WalletRes;
import com.woodcert.auction.feature.finance.dto.response.WalletTransactionRes;
import com.woodcert.auction.feature.finance.entity.Wallet;
import com.woodcert.auction.feature.finance.entity.WalletOperation;
import com.woodcert.auction.feature.finance.entity.WalletReferenceType;
import com.woodcert.auction.feature.finance.entity.WalletTransaction;
import com.woodcert.auction.feature.finance.entity.WalletTransactionStatus;
import com.woodcert.auction.feature.finance.entity.WalletTransactionType;
import com.woodcert.auction.feature.finance.repository.WalletRepository;
import com.woodcert.auction.feature.finance.repository.WalletTransactionRepository;
import com.woodcert.auction.feature.finance.support.FinanceOperationKey;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import jakarta.persistence.OptimisticLockException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.function.Consumer;

@Slf4j
@Service
@RequiredArgsConstructor
public class WalletServiceImpl implements WalletService {

    private static final int MONEY_SCALE = 2;
    private static final RoundingMode MONEY_ROUNDING = RoundingMode.HALF_UP;

    private final WalletBootstrapService walletBootstrapService;
    private final WalletOperationLifecycleService walletOperationLifecycleService;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final UserRepository userRepository;
    private final FinanceProperties financeProperties;

    @Override
    @Transactional
    public WalletRes getMyWallet(String userId) {
        return WalletRes.fromEntity(getOrCreateWallet(userId), financeProperties.getAppraisalFee());
    }

    @Override
    @Transactional
    public PaginationResponse<WalletTransactionRes> getMyTransactions(String userId, int page, int size) {
        Wallet wallet = getOrCreateWallet(userId);
        Pageable pageable = PageRequest.of(Math.max(0, page - 1), Math.min(Math.max(size, 1), 50));
        Page<WalletTransactionRes> transactionPage = walletTransactionRepository
                .findByWalletIdOrderByCreatedAtDescIdDesc(wallet.getId(), pageable)
                .map(WalletTransactionRes::fromEntity);
        return PaginationResponse.of(transactionPage);
    }

    @Override
    @Transactional
    public void topUpFromVnPay(
            String userId, FinanceOperationKey operationKey, BigDecimal amount, Long depositId) {
        creditAvailable(userId, operationKey, amount, depositId,
                WalletReferenceType.VNPAY_DEPOSIT, WalletTransactionType.WALLET_TOP_UP);
    }

    @Override
    @Transactional
    public void chargeAppraisalFee(
            String userId, FinanceOperationKey operationKey, BigDecimal amount, Long productId) {
        debitAvailable(userId, operationKey, amount, productId,
                WalletReferenceType.APPRAISAL, WalletTransactionType.APPRAISAL_FEE);
    }

    @Override
    @Transactional
    public void freezeAuctionDeposit(
            String userId, FinanceOperationKey operationKey, BigDecimal amount, Long auctionId) {
        BigDecimal normalizedAmount = normalizePositiveAmount(amount);
        executeIdempotentMutation(
                userId,
                operationKey,
                normalizedAmount,
                auctionId,
                WalletReferenceType.AUCTION,
                WalletTransactionType.AUCTION_DEPOSIT_FREEZE,
                wallet -> {
                    if (wallet.getAvailableBalance().compareTo(normalizedAmount) < 0) {
                        throw new AppException(ErrorCode.WALLET_INSUFFICIENT_AVAILABLE_BALANCE);
                    }
                    wallet.setAvailableBalance(wallet.getAvailableBalance().subtract(normalizedAmount));
                    wallet.setFrozenBalance(wallet.getFrozenBalance().add(normalizedAmount));
                },
                normalizedAmount.negate());
    }

    @Override
    @Transactional
    public void releaseAuctionDeposit(
            String userId, FinanceOperationKey operationKey, BigDecimal amount, Long auctionId) {
        BigDecimal normalizedAmount = normalizePositiveAmount(amount);
        executeIdempotentMutation(
                userId,
                operationKey,
                normalizedAmount,
                auctionId,
                WalletReferenceType.AUCTION,
                WalletTransactionType.AUCTION_DEPOSIT_RELEASE,
                wallet -> {
                    if (wallet.getFrozenBalance().compareTo(normalizedAmount) < 0) {
                        throw new AppException(ErrorCode.WALLET_INSUFFICIENT_FROZEN_BALANCE);
                    }
                    wallet.setFrozenBalance(wallet.getFrozenBalance().subtract(normalizedAmount));
                    wallet.setAvailableBalance(wallet.getAvailableBalance().add(normalizedAmount));
                },
                normalizedAmount);
    }

    @Override
    @Transactional
    public void captureAuctionDeposit(
            String userId, FinanceOperationKey operationKey, BigDecimal amount, Long auctionId) {
        BigDecimal normalizedAmount = normalizePositiveAmount(amount);
        executeIdempotentMutation(
                userId,
                operationKey,
                normalizedAmount,
                auctionId,
                WalletReferenceType.AUCTION,
                WalletTransactionType.AUCTION_DEPOSIT_CAPTURE,
                wallet -> {
                    if (wallet.getFrozenBalance().compareTo(normalizedAmount) < 0) {
                        throw new AppException(ErrorCode.WALLET_INSUFFICIENT_FROZEN_BALANCE);
                    }
                    wallet.setFrozenBalance(wallet.getFrozenBalance().subtract(normalizedAmount));
                },
                normalizedAmount.negate());
    }

    @Override
    @Transactional
    public void payOrder(String userId, FinanceOperationKey operationKey, BigDecimal amount, Long orderId) {
        debitAvailable(userId, operationKey, amount, orderId,
                WalletReferenceType.ORDER, WalletTransactionType.ORDER_PAYMENT);
    }

    @Override
    @Transactional
    public void refundOrder(String userId, FinanceOperationKey operationKey, BigDecimal amount, Long orderId) {
        creditAvailable(userId, operationKey, amount, orderId,
                WalletReferenceType.ORDER, WalletTransactionType.ORDER_REFUND);
    }

    @Override
    @Transactional
    public void creditSellerPayout(
            String userId, FinanceOperationKey operationKey, BigDecimal amount, Long orderId) {
        creditAvailable(userId, operationKey, amount, orderId,
                WalletReferenceType.ORDER, WalletTransactionType.SELLER_PAYOUT);
    }

    @Override
    @Transactional
    public void creditSellerForfeitCompensation(
            String userId, FinanceOperationKey operationKey, BigDecimal amount, Long orderId) {
        creditAvailable(userId, operationKey, amount, orderId,
                WalletReferenceType.ORDER, WalletTransactionType.SELLER_FORFEIT_COMPENSATION);
    }

    private void creditAvailable(
            String userId,
            FinanceOperationKey operationKey,
            BigDecimal amount,
            Long referenceId,
            WalletReferenceType referenceType,
            WalletTransactionType transactionType) {
        BigDecimal normalizedAmount = normalizePositiveAmount(amount);
        executeIdempotentMutation(
                userId,
                operationKey,
                normalizedAmount,
                referenceId,
                referenceType,
                transactionType,
                wallet -> wallet.setAvailableBalance(wallet.getAvailableBalance().add(normalizedAmount)),
                normalizedAmount);
    }

    private void debitAvailable(
            String userId,
            FinanceOperationKey operationKey,
            BigDecimal amount,
            Long referenceId,
            WalletReferenceType referenceType,
            WalletTransactionType transactionType) {
        BigDecimal normalizedAmount = normalizePositiveAmount(amount);
        executeIdempotentMutation(
                userId,
                operationKey,
                normalizedAmount,
                referenceId,
                referenceType,
                transactionType,
                wallet -> {
                    if (wallet.getAvailableBalance().compareTo(normalizedAmount) < 0) {
                        throw new AppException(ErrorCode.WALLET_INSUFFICIENT_AVAILABLE_BALANCE);
                    }
                    wallet.setAvailableBalance(wallet.getAvailableBalance().subtract(normalizedAmount));
                },
                normalizedAmount.negate());
    }

    private void executeIdempotentMutation(
            String userId,
            FinanceOperationKey operationKey,
            BigDecimal amount,
            Long referenceId,
            WalletReferenceType referenceType,
            WalletTransactionType transactionType,
            Consumer<Wallet> mutation,
            BigDecimal signedAvailableDelta) {
        if (operationKey == null) {
            throw new AppException(ErrorCode.WALLET_OPERATION_KEY_INVALID);
        }
        String normalizedOperationKey = operationKey.value();
        validateReference(referenceType, referenceId);
        Wallet wallet = getOrCreateWallet(userId);

        WalletOperation reservedOperation = walletOperationLifecycleService.reserveOrReuseOperation(
                wallet.getId(),
                normalizedOperationKey,
                amount,
                transactionType,
                referenceId,
                referenceType);
        if (reservedOperation == null) {
            return;
        }

        boolean finalizedAfterCommit = registerOperationCompletionHooks(reservedOperation.getId());
        try {
            mutation.accept(wallet);
            walletRepository.saveAndFlush(wallet);
            logTransaction(wallet, signedAvailableDelta, transactionType, referenceId, referenceType);
            if (!finalizedAfterCommit) {
                walletOperationLifecycleService.markSuccess(reservedOperation.getId());
                log.info("Wallet mutation {} applied for user {} with operationKey={}",
                        transactionType, userId, normalizedOperationKey);
            }
        } catch (ObjectOptimisticLockingFailureException | OptimisticLockException ex) {
            walletOperationLifecycleService.markFailed(
                    reservedOperation.getId(),
                    ErrorCode.WALLET_CONCURRENT_MODIFICATION.name(),
                    ErrorCode.WALLET_CONCURRENT_MODIFICATION.getMessage());
            throw new AppException(ErrorCode.WALLET_CONCURRENT_MODIFICATION);
        } catch (AppException ex) {
            walletOperationLifecycleService.markFailed(
                    reservedOperation.getId(),
                    resolveFailureCode(ex),
                    ex.getMessage());
            throw ex;
        } catch (RuntimeException ex) {
            walletOperationLifecycleService.markFailed(
                    reservedOperation.getId(),
                    ErrorCode.UNCATEGORIZED.name(),
                    ex.getMessage());
            throw ex;
        }
    }

    private Wallet getOrCreateWallet(String userId) {
        ensureUserExists(userId);
        return walletRepository.findByUserId(userId)
                .orElseGet(() -> walletBootstrapService.getOrCreateWallet(userId));
    }

    private void ensureUserExists(String userId) {
        if (!userRepository.existsById(userId)) {
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, "User not found");
        }
    }

    private BigDecimal normalizePositiveAmount(BigDecimal amount) {
        BigDecimal normalized = normalizeMoney(amount);
        if (normalized.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.WALLET_AMOUNT_INVALID);
        }
        return normalized;
    }

    private void logTransaction(
            Wallet wallet,
            BigDecimal amount,
            WalletTransactionType type,
            Long referenceId,
            WalletReferenceType referenceType) {
        WalletTransaction transaction = new WalletTransaction();
        transaction.setWalletId(wallet.getId());
        transaction.setAmount(amount);
        transaction.setType(type);
        transaction.setReferenceId(referenceId);
        transaction.setReferenceType(referenceType);
        transaction.setStatus(WalletTransactionStatus.SUCCESS);
        walletTransactionRepository.save(transaction);
    }

    private void validateReference(WalletReferenceType referenceType, Long referenceId) {
        if (referenceType == null) {
            throw new AppException(ErrorCode.WALLET_REFERENCE_INVALID);
        }
        if ((referenceType == WalletReferenceType.AUCTION
                || referenceType == WalletReferenceType.APPRAISAL
                || referenceType == WalletReferenceType.ORDER)
                && referenceId == null) {
            throw new AppException(ErrorCode.WALLET_REFERENCE_INVALID);
        }
    }

    private BigDecimal normalizeMoney(BigDecimal amount) {
        if (amount == null) {
            throw new AppException(ErrorCode.WALLET_AMOUNT_INVALID);
        }
        return amount.setScale(MONEY_SCALE, MONEY_ROUNDING);
    }

    private boolean registerOperationCompletionHooks(Long operationId) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            return false;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                walletOperationLifecycleService.markSuccess(operationId);
            }

            @Override
            public void afterCompletion(int status) {
                if (status != STATUS_COMMITTED) {
                    walletOperationLifecycleService.markFailed(
                            operationId,
                            ErrorCode.UNCATEGORIZED.name(),
                            "Wallet mutation rolled back before commit");
                }
            }
        });
        return true;
    }

    private String resolveFailureCode(AppException exception) {
        return exception.getErrorCode() != null
                ? exception.getErrorCode().name()
                : ErrorCode.UNCATEGORIZED.name();
    }
}
