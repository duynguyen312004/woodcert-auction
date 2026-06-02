package com.woodcert.auction.feature.finance.service;

import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.finance.dto.response.WalletRes;
import com.woodcert.auction.feature.finance.dto.response.WalletTransactionRes;
import com.woodcert.auction.feature.finance.entity.*;
import com.woodcert.auction.feature.finance.repository.WalletRepository;
import com.woodcert.auction.feature.finance.repository.WalletTransactionRepository;
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

    @Override
    @Transactional
    public WalletRes getMyWallet(String userId) {
        return WalletRes.fromEntity(getOrCreateWallet(userId));
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
    public void depositFunds(
            String userId,
            String operationKey,
            BigDecimal amount,
            Long referenceId,
            WalletReferenceType referenceType) {
        // Bước 1: Chuẩn hóa số tiền nạp về định dạng tiền tệ dương.
        BigDecimal normalizedAmount = normalizePositiveAmount(amount);

        // Bước 2: Gửi mutation cộng số dư available qua executor idempotent chung.
        executeIdempotentMutation(
                userId,
                operationKey,
                normalizedAmount,
                referenceId,
                referenceType,
                WalletTransactionType.DEPOSIT,
                wallet -> wallet.setAvailableBalance(wallet.getAvailableBalance().add(normalizedAmount)),
                normalizedAmount
        );
    }

    @Override
    @Transactional
    public void freezeFunds(
            String userId,
            String operationKey,
            BigDecimal amount,
            Long referenceId,
            WalletReferenceType referenceType) {
        // Bước 1: Chuẩn hóa số tiền cần đóng băng trước khi kiểm tra số dư.
        BigDecimal normalizedAmount = normalizePositiveAmount(amount);

        // Bước 2: Trừ available và cộng frozen trong cùng mutation idempotent.
        executeIdempotentMutation(
                userId,
                operationKey,
                normalizedAmount,
                referenceId,
                referenceType,
                WalletTransactionType.FREEZE,
                wallet -> {
                    if (wallet.getAvailableBalance().compareTo(normalizedAmount) < 0) {
                        throw new AppException(ErrorCode.WALLET_INSUFFICIENT_AVAILABLE_BALANCE);
                    }
                    wallet.setAvailableBalance(wallet.getAvailableBalance().subtract(normalizedAmount));
                    wallet.setFrozenBalance(wallet.getFrozenBalance().add(normalizedAmount));
                },
                normalizedAmount.negate()
        );
    }

    @Override
    @Transactional
    public void unfreezeFunds(
            String userId,
            String operationKey,
            BigDecimal amount,
            Long referenceId,
            WalletReferenceType referenceType) {
        // Bước 1: Chuẩn hóa số tiền cần mở đóng băng.
        BigDecimal normalizedAmount = normalizePositiveAmount(amount);

        // Bước 2: Chuyển tiền từ frozen về available trong cùng mutation idempotent.
        executeIdempotentMutation(
                userId,
                operationKey,
                normalizedAmount,
                referenceId,
                referenceType,
                WalletTransactionType.UNFREEZE,
                wallet -> {
                    if (wallet.getFrozenBalance().compareTo(normalizedAmount) < 0) {
                        throw new AppException(ErrorCode.WALLET_INSUFFICIENT_FROZEN_BALANCE);
                    }
                    wallet.setFrozenBalance(wallet.getFrozenBalance().subtract(normalizedAmount));
                    wallet.setAvailableBalance(wallet.getAvailableBalance().add(normalizedAmount));
                },
                normalizedAmount
        );
    }

    @Override
    @Transactional
    public void deductFrozenFunds(
            String userId,
            String operationKey,
            BigDecimal amount,
            Long referenceId,
            WalletReferenceType referenceType) {
        // Bước 1: Chuẩn hóa số tiền cần thu từ phần đang bị đóng băng.
        BigDecimal normalizedAmount = normalizePositiveAmount(amount);

        // Bước 2: Trừ frozen để ghi nhận thanh toán, không cộng lại available.
        executeIdempotentMutation(
                userId,
                operationKey,
                normalizedAmount,
                referenceId,
                referenceType,
                WalletTransactionType.PAYMENT,
                wallet -> {
                    if (wallet.getFrozenBalance().compareTo(normalizedAmount) < 0) {
                        throw new AppException(ErrorCode.WALLET_INSUFFICIENT_FROZEN_BALANCE);
                    }
                    wallet.setFrozenBalance(wallet.getFrozenBalance().subtract(normalizedAmount));
                },
                normalizedAmount.negate()
        );
    }

    @Override
    @Transactional
    public void withdrawFunds(
            String userId,
            String operationKey,
            BigDecimal amount,
            Long referenceId,
            WalletReferenceType referenceType) {
        BigDecimal normalizedAmount = normalizePositiveAmount(amount);

        executeIdempotentMutation(
                userId,
                operationKey,
                normalizedAmount,
                referenceId,
                referenceType,
                WalletTransactionType.WITHDRAW,
                wallet -> {
                    if (wallet.getAvailableBalance().compareTo(normalizedAmount) < 0) {
                        throw new AppException(ErrorCode.WALLET_INSUFFICIENT_AVAILABLE_BALANCE);
                    }
                    wallet.setAvailableBalance(wallet.getAvailableBalance().subtract(normalizedAmount));
                },
                normalizedAmount.negate()
        );
    }

    private void executeIdempotentMutation(
            String userId,
            String operationKey,
            BigDecimal amount,
            Long referenceId,
            WalletReferenceType referenceType,
            WalletTransactionType transactionType,
            Consumer<Wallet> mutation,
            BigDecimal signedAvailableDelta) {
        // Bước 1: Chuẩn hóa operation key, kiểm tra reference và lấy ví hiện tại hoặc tạo ví mới.
        String normalizedOperationKey = normalizeOperationKey(operationKey);
        validateReference(referenceType, referenceId);
        Wallet wallet = getOrCreateWallet(userId);

        // Bước 2: Reserve operation để cùng một operationKey không bị xử lý lặp lại.
        WalletOperation reservedOperation = walletOperationLifecycleService.reserveOrReuseOperation(
                wallet.getId(),
                normalizedOperationKey,
                amount,
                transactionType,
                referenceId,
                referenceType
        );

        if (reservedOperation == null) {
            return;
        }

        // Bước 3: Đăng ký hook kết thúc transaction để chỉ mark SUCCESS sau khi commit thật sự thành công.
        boolean finalizedAfterCommit = registerOperationCompletionHooks(reservedOperation.getId());

        try {
            // Bước 4: Áp mutation lên số dư ví, lưu ví và ghi lịch sử giao dịch cùng transaction DB.
            mutation.accept(wallet);
            walletRepository.saveAndFlush(wallet);
            logTransaction(wallet, signedAvailableDelta, transactionType, referenceId, referenceType);
            if (!finalizedAfterCommit) {
                // Bước 5: Nếu không có transaction synchronization thì mark SUCCESS ngay sau khi lưu dữ liệu.
                walletOperationLifecycleService.markSuccess(reservedOperation.getId());
                log.info("Wallet mutation {} applied for user {} with operationKey={}",
                        transactionType, userId, normalizedOperationKey);
            }
        } catch (ObjectOptimisticLockingFailureException | OptimisticLockException ex) {
            // Bước 6: Ghi trạng thái FAILED rõ nguyên nhân khi có xung đột optimistic locking.
            walletOperationLifecycleService.markFailed(
                    reservedOperation.getId(),
                    ErrorCode.WALLET_CONCURRENT_MODIFICATION.name(),
                    ErrorCode.WALLET_CONCURRENT_MODIFICATION.getMessage()
            );
            throw new AppException(ErrorCode.WALLET_CONCURRENT_MODIFICATION);
        } catch (AppException ex) {
            // Bước 7: Lỗi nghiệp vụ được lưu lại theo error code để lần gọi sau có thể truy vết.
            walletOperationLifecycleService.markFailed(
                    reservedOperation.getId(),
                    resolveFailureCode(ex),
                    ex.getMessage()
            );
            throw ex;
        } catch (RuntimeException ex) {
            // Bước 8: Lỗi runtime ngoài dự kiến vẫn phải mark FAILED trước khi ném tiếp.
            walletOperationLifecycleService.markFailed(
                    reservedOperation.getId(),
                    ErrorCode.UNCATEGORIZED.name(),
                    ex.getMessage()
            );
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

    private String normalizeOperationKey(String operationKey) {
        if (operationKey == null || operationKey.isBlank()) {
            throw new AppException(ErrorCode.WALLET_OPERATION_KEY_INVALID);
        }
        return operationKey.trim();
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
                            "Wallet mutation rolled back before commit"
                    );
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
