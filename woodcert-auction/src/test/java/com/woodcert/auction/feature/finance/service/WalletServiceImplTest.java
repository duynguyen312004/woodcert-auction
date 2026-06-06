package com.woodcert.auction.feature.finance.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.finance.config.FinanceProperties;
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
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.orm.ObjectOptimisticLockingFailureException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WalletServiceImplTest {

    @Mock private WalletBootstrapService walletBootstrapService;
    @Mock private WalletOperationLifecycleService walletOperationLifecycleService;
    @Mock private WalletRepository walletRepository;
    @Mock private WalletTransactionRepository walletTransactionRepository;
    @Mock private UserRepository userRepository;
    @Mock private FinanceProperties financeProperties;

    @InjectMocks
    private WalletServiceImpl walletService;

    private static final String USER_ID = "user-1";

    private FinanceOperationKey operationKey(String value) {
        return FinanceOperationKey.of(value);
    }

    private Wallet createWallet(BigDecimal available, BigDecimal frozen) {
        Wallet wallet = new Wallet();
        wallet.setId(10L);
        wallet.setUserId(USER_ID);
        wallet.setAvailableBalance(available);
        wallet.setFrozenBalance(frozen);
        wallet.setVersion(0);
        return wallet;
    }

    private WalletOperation createReservedOperation(Long id, String operationKey, WalletTransactionType type) {
        WalletOperation operation = new WalletOperation();
        operation.setId(id);
        operation.setOperationKey(operationKey);
        operation.setWalletId(10L);
        operation.setType(type);
        operation.setStatus(WalletTransactionStatus.PENDING);
        return operation;
    }

    @Nested
    @DisplayName("getMyWallet")
    class GetMyWallet {

        @Test
        @DisplayName("should lazily create zero-balance wallet when missing")
        void getMyWallet_createsWalletIfMissing() {
            Wallet createdWallet = createWallet(BigDecimal.ZERO, BigDecimal.ZERO);
            when(userRepository.existsById(USER_ID)).thenReturn(true);
            when(walletRepository.findByUserId(USER_ID)).thenReturn(Optional.empty());
            when(walletBootstrapService.getOrCreateWallet(USER_ID)).thenReturn(createdWallet);
            when(financeProperties.getAppraisalFee()).thenReturn(new BigDecimal("1000000"));

            var result = walletService.getMyWallet(USER_ID);

            assertThat(result.id()).isEqualTo(10L);
            assertThat(result.availableBalance()).isEqualByComparingTo("0");
            assertThat(result.frozenBalance()).isEqualByComparingTo("0");
            assertThat(result.appraisalFee()).isEqualByComparingTo("1000000");
        }
    }



    @Nested
    @DisplayName("depositFunds")
    class DepositFunds {

        @Test
        @DisplayName("should normalize amount once and use the canonical value everywhere")
        void depositFunds_normalizesCanonicalAmountOnce() {
            Wallet wallet = createWallet(new BigDecimal("1000000"), BigDecimal.ZERO);
            WalletOperation reserved = createReservedOperation(201L, "deposit-scale", WalletTransactionType.DEPOSIT);

            when(userRepository.existsById(USER_ID)).thenReturn(true);
            when(walletRepository.findByUserId(USER_ID)).thenReturn(Optional.of(wallet));
            when(walletOperationLifecycleService.reserveOrReuseOperation(
                    eq(10L), eq("deposit-scale"), eq(new BigDecimal("100.24")), eq(WalletTransactionType.DEPOSIT), eq(null), eq(WalletReferenceType.SYSTEM)
            )).thenReturn(reserved);
            when(walletRepository.saveAndFlush(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

            walletService.depositFunds(USER_ID, operationKey("deposit-scale"), new BigDecimal("100.235"), null, WalletReferenceType.SYSTEM);

            assertThat(wallet.getAvailableBalance()).isEqualByComparingTo("1000100.24");
            ArgumentCaptor<WalletTransaction> transactionCaptor = ArgumentCaptor.forClass(WalletTransaction.class);
            verify(walletTransactionRepository).save(transactionCaptor.capture());
            assertThat(transactionCaptor.getValue().getAmount()).isEqualByComparingTo("100.24");
            verify(walletOperationLifecycleService).markSuccess(201L);
        }

        @Test
        @DisplayName("should be idempotent for the same operation key and payload")
        void depositFunds_sameOperationKey_noop() {
            Wallet wallet = createWallet(new BigDecimal("1000000"), BigDecimal.ZERO);

            when(userRepository.existsById(USER_ID)).thenReturn(true);
            when(walletRepository.findByUserId(USER_ID)).thenReturn(Optional.of(wallet));
            when(walletOperationLifecycleService.reserveOrReuseOperation(
                    eq(10L), eq("deposit-ok"), eq(new BigDecimal("500000.00")), eq(WalletTransactionType.DEPOSIT), eq(null), eq(WalletReferenceType.SYSTEM)
            )).thenReturn(null);

            walletService.depositFunds(USER_ID, operationKey("deposit-ok"), new BigDecimal("500000"), null, WalletReferenceType.SYSTEM);

            assertThat(wallet.getAvailableBalance()).isEqualByComparingTo("1000000");
            verify(walletRepository, never()).saveAndFlush(any(Wallet.class));
            verify(walletTransactionRepository, never()).save(any(WalletTransaction.class));
        }
    }

    @Nested
    @DisplayName("freezeFunds")
    class FreezeFunds {

        @Test
        @DisplayName("should move amount from available to frozen")
        void freezeFunds_success() {
            Wallet wallet = createWallet(new BigDecimal("5000000"), new BigDecimal("500000"));
            WalletOperation reserved = createReservedOperation(301L, "freeze-1", WalletTransactionType.FREEZE);

            when(userRepository.existsById(USER_ID)).thenReturn(true);
            when(walletRepository.findByUserId(USER_ID)).thenReturn(Optional.of(wallet));
            when(walletOperationLifecycleService.reserveOrReuseOperation(
                    eq(10L), eq("freeze-1"), eq(new BigDecimal("1000000.00")), eq(WalletTransactionType.FREEZE), eq(205L), eq(WalletReferenceType.AUCTION)
            )).thenReturn(reserved);
            when(walletRepository.saveAndFlush(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

            walletService.freezeFunds(USER_ID, operationKey("freeze-1"), new BigDecimal("1000000"), 205L, WalletReferenceType.AUCTION);

            assertThat(wallet.getAvailableBalance()).isEqualByComparingTo("4000000.00");
            assertThat(wallet.getFrozenBalance()).isEqualByComparingTo("1500000.00");
            ArgumentCaptor<WalletTransaction> transactionCaptor = ArgumentCaptor.forClass(WalletTransaction.class);
            verify(walletTransactionRepository).save(transactionCaptor.capture());
            assertThat(transactionCaptor.getValue().getType()).isEqualTo(WalletTransactionType.FREEZE);
            assertThat(transactionCaptor.getValue().getAmount()).isEqualByComparingTo("-1000000.00");
            verify(walletOperationLifecycleService).markSuccess(301L);
        }

        @Test
        @DisplayName("should reject when available balance is insufficient and finalize operation as FAILED")
        void freezeFunds_insufficientAvailable_throws() {
            Wallet wallet = createWallet(new BigDecimal("500000"), BigDecimal.ZERO);
            WalletOperation reserved = createReservedOperation(302L, "freeze-2", WalletTransactionType.FREEZE);

            when(userRepository.existsById(USER_ID)).thenReturn(true);
            when(walletRepository.findByUserId(USER_ID)).thenReturn(Optional.of(wallet));
            when(walletOperationLifecycleService.reserveOrReuseOperation(
                    eq(10L), eq("freeze-2"), eq(new BigDecimal("1000000.00")), eq(WalletTransactionType.FREEZE), eq(205L), eq(WalletReferenceType.AUCTION)
            )).thenReturn(reserved);

            assertThatThrownBy(() -> walletService.freezeFunds(
                    USER_ID, operationKey("freeze-2"), new BigDecimal("1000000"), 205L, WalletReferenceType.AUCTION))
                    .isInstanceOf(AppException.class)
                    .satisfies(throwable -> {
                        AppException exception = (AppException) throwable;
                        assertThat(exception.getStatusCode())
                                .isEqualTo(ErrorCode.WALLET_INSUFFICIENT_AVAILABLE_BALANCE.getStatusCode());
                    });

            verify(walletOperationLifecycleService).markFailed(
                    eq(302L),
                    eq(ErrorCode.WALLET_INSUFFICIENT_AVAILABLE_BALANCE.name()),
                    eq(ErrorCode.WALLET_INSUFFICIENT_AVAILABLE_BALANCE.getMessage())
            );
        }

        @Test
        @DisplayName("should reject missing reference id for auction mutation before reserving operation")
        void freezeFunds_missingAuctionReference_throws() {
            assertThatThrownBy(() -> walletService.freezeFunds(
                    USER_ID, operationKey("freeze-ref"), new BigDecimal("1000000"), null, WalletReferenceType.AUCTION))
                    .isInstanceOf(AppException.class)
                    .satisfies(throwable -> {
                        AppException exception = (AppException) throwable;
                        assertThat(exception.getStatusCode()).isEqualTo(ErrorCode.WALLET_REFERENCE_INVALID.getStatusCode());
                    });

            verifyNoInteractions(walletOperationLifecycleService);
        }

        @Test
        @DisplayName("should normalize amount before applying mutation")
        void freezeFunds_normalizesAmount() {
            Wallet wallet = createWallet(new BigDecimal("5000000"), BigDecimal.ZERO);
            WalletOperation reserved = createReservedOperation(303L, "freeze-scale", WalletTransactionType.FREEZE);

            when(userRepository.existsById(USER_ID)).thenReturn(true);
            when(walletRepository.findByUserId(USER_ID)).thenReturn(Optional.of(wallet));
            when(walletOperationLifecycleService.reserveOrReuseOperation(
                    eq(10L), eq("freeze-scale"), eq(new BigDecimal("100.24")), eq(WalletTransactionType.FREEZE), eq(205L), eq(WalletReferenceType.AUCTION)
            )).thenReturn(reserved);
            when(walletRepository.saveAndFlush(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

            walletService.freezeFunds(USER_ID, operationKey("freeze-scale"), new BigDecimal("100.235"), 205L, WalletReferenceType.AUCTION);

            assertThat(wallet.getAvailableBalance()).isEqualByComparingTo("4999899.76");
            assertThat(wallet.getFrozenBalance()).isEqualByComparingTo("100.24");
        }

        @Test
        @DisplayName("should map optimistic lock failure to retryable business error and finalize FAILED")
        void freezeFunds_concurrentModification_throwsRetryableError() {
            Wallet wallet = createWallet(new BigDecimal("5000000"), BigDecimal.ZERO);
            WalletOperation reserved = createReservedOperation(304L, "freeze-conflict", WalletTransactionType.FREEZE);

            when(userRepository.existsById(USER_ID)).thenReturn(true);
            when(walletRepository.findByUserId(USER_ID)).thenReturn(Optional.of(wallet));
            when(walletOperationLifecycleService.reserveOrReuseOperation(
                    eq(10L), eq("freeze-conflict"), eq(new BigDecimal("1000000.00")), eq(WalletTransactionType.FREEZE), eq(205L), eq(WalletReferenceType.AUCTION)
            )).thenReturn(reserved);
            when(walletRepository.saveAndFlush(any(Wallet.class)))
                    .thenThrow(new ObjectOptimisticLockingFailureException(Wallet.class, 10L));

            assertThatThrownBy(() -> walletService.freezeFunds(
                    USER_ID, operationKey("freeze-conflict"), new BigDecimal("1000000"), 205L, WalletReferenceType.AUCTION))
                    .isInstanceOf(AppException.class)
                    .satisfies(throwable -> {
                        AppException exception = (AppException) throwable;
                        assertThat(exception.getStatusCode())
                                .isEqualTo(ErrorCode.WALLET_CONCURRENT_MODIFICATION.getStatusCode());
                    });

            verify(walletOperationLifecycleService).markFailed(
                    eq(304L),
                    eq(ErrorCode.WALLET_CONCURRENT_MODIFICATION.name()),
                    eq(ErrorCode.WALLET_CONCURRENT_MODIFICATION.getMessage())
            );
        }

        @Test
        @DisplayName("should finalize FAILED when transaction logging throws an unexpected runtime error")
        void freezeFunds_transactionLogFailure_marksFailed() {
            Wallet wallet = createWallet(new BigDecimal("5000000"), BigDecimal.ZERO);
            WalletOperation reserved = createReservedOperation(305L, "freeze-log-fail", WalletTransactionType.FREEZE);

            when(userRepository.existsById(USER_ID)).thenReturn(true);
            when(walletRepository.findByUserId(USER_ID)).thenReturn(Optional.of(wallet));
            when(walletOperationLifecycleService.reserveOrReuseOperation(
                    eq(10L), eq("freeze-log-fail"), eq(new BigDecimal("1000000.00")), eq(WalletTransactionType.FREEZE), eq(205L), eq(WalletReferenceType.AUCTION)
            )).thenReturn(reserved);
            when(walletRepository.saveAndFlush(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(walletTransactionRepository.save(any(WalletTransaction.class)))
                    .thenThrow(new IllegalStateException("transaction-log failure"));

            assertThatThrownBy(() -> walletService.freezeFunds(
                    USER_ID, operationKey("freeze-log-fail"), new BigDecimal("1000000"), 205L, WalletReferenceType.AUCTION))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("transaction-log failure");

            verify(walletOperationLifecycleService).markFailed(
                    eq(305L),
                    eq(ErrorCode.UNCATEGORIZED.name()),
                    eq("transaction-log failure")
            );
        }
    }

    @Nested
    @DisplayName("unfreezeFunds")
    class UnfreezeFunds {

        @Test
        @DisplayName("should move amount from frozen back to available")
        void unfreezeFunds_success() {
            Wallet wallet = createWallet(new BigDecimal("1000000"), new BigDecimal("3000000"));
            WalletOperation reserved = createReservedOperation(401L, "unfreeze-1", WalletTransactionType.UNFREEZE);

            when(userRepository.existsById(USER_ID)).thenReturn(true);
            when(walletRepository.findByUserId(USER_ID)).thenReturn(Optional.of(wallet));
            when(walletOperationLifecycleService.reserveOrReuseOperation(
                    eq(10L), eq("unfreeze-1"), eq(new BigDecimal("500000.00")), eq(WalletTransactionType.UNFREEZE), eq(205L), eq(WalletReferenceType.AUCTION)
            )).thenReturn(reserved);
            when(walletRepository.saveAndFlush(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

            walletService.unfreezeFunds(USER_ID, operationKey("unfreeze-1"), new BigDecimal("500000"), 205L, WalletReferenceType.AUCTION);

            assertThat(wallet.getAvailableBalance()).isEqualByComparingTo("1500000.00");
            assertThat(wallet.getFrozenBalance()).isEqualByComparingTo("2500000.00");
            verify(walletOperationLifecycleService).markSuccess(401L);
        }
    }

    @Nested
    @DisplayName("deductFrozenFunds")
    class DeductFrozenFunds {

        @Test
        @DisplayName("should deduct amount from frozen balance and log PAYMENT")
        void deductFrozenFunds_success() {
            Wallet wallet = createWallet(new BigDecimal("2000000"), new BigDecimal("4000000"));
            WalletOperation reserved = createReservedOperation(501L, "deduct-1", WalletTransactionType.PAYMENT);

            when(userRepository.existsById(USER_ID)).thenReturn(true);
            when(walletRepository.findByUserId(USER_ID)).thenReturn(Optional.of(wallet));
            when(walletOperationLifecycleService.reserveOrReuseOperation(
                    eq(10L), eq("deduct-1"), eq(new BigDecimal("1500000.00")), eq(WalletTransactionType.PAYMENT), eq(205L), eq(WalletReferenceType.AUCTION)
            )).thenReturn(reserved);
            when(walletRepository.saveAndFlush(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

            walletService.deductFrozenFunds(USER_ID, operationKey("deduct-1"), new BigDecimal("1500000"), 205L, WalletReferenceType.AUCTION);

            assertThat(wallet.getAvailableBalance()).isEqualByComparingTo("2000000");
            assertThat(wallet.getFrozenBalance()).isEqualByComparingTo("2500000.00");
            ArgumentCaptor<WalletTransaction> transactionCaptor = ArgumentCaptor.forClass(WalletTransaction.class);
            verify(walletTransactionRepository).save(transactionCaptor.capture());
            assertThat(transactionCaptor.getValue().getType()).isEqualTo(WalletTransactionType.PAYMENT);
            assertThat(transactionCaptor.getValue().getAmount()).isEqualByComparingTo("-1500000.00");
            verify(walletOperationLifecycleService).markSuccess(501L);
        }
    }

    @Nested
    @DisplayName("getMyTransactions")
    class GetMyTransactions {

        @Test
        @DisplayName("should return paginated transaction history")
        void getMyTransactions_success() {
            Wallet wallet = createWallet(new BigDecimal("1000000"), BigDecimal.ZERO);
            WalletTransaction tx = new WalletTransaction();
            tx.setId(99L);
            tx.setWalletId(10L);
            tx.setAmount(new BigDecimal("2000000"));
            tx.setType(WalletTransactionType.DEPOSIT);
            tx.setReferenceType(WalletReferenceType.SYSTEM);
            tx.setStatus(WalletTransactionStatus.SUCCESS);
            tx.setCreatedAt(Instant.parse("2026-04-19T03:00:00Z"));

            when(userRepository.existsById(USER_ID)).thenReturn(true);
            when(walletRepository.findByUserId(USER_ID)).thenReturn(Optional.of(wallet));
            when(walletTransactionRepository.findByWalletIdOrderByCreatedAtDescIdDesc(eq(10L), any(PageRequest.class)))
                    .thenReturn(new PageImpl<>(List.of(tx), PageRequest.of(0, 10), 1));

            var result = walletService.getMyTransactions(USER_ID, 1, 10);

            assertThat(result.result()).hasSize(1);
            assertThat(result.result().get(0).id()).isEqualTo(99L);
            assertThat(result.result().get(0).type()).isEqualTo(WalletTransactionType.DEPOSIT);
        }
    }
}
