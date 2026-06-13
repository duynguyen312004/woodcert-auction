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
    @DisplayName("topUpFromVnPay")
    class DepositFunds {

        @Test
        @DisplayName("should normalize amount once and use the canonical value everywhere")
        void topUpFromVnPay_normalizesCanonicalAmountOnce() {
            Wallet wallet = createWallet(new BigDecimal("1000000"), BigDecimal.ZERO);
            WalletOperation reserved = createReservedOperation(201L, "deposit-scale", WalletTransactionType.WALLET_TOP_UP);

            when(userRepository.existsById(USER_ID)).thenReturn(true);
            when(walletRepository.findByUserId(USER_ID)).thenReturn(Optional.of(wallet));
            when(walletOperationLifecycleService.reserveOrReuseOperation(
                    eq(10L), eq("deposit-scale"), eq(new BigDecimal("100.24")),
                    eq(WalletTransactionType.WALLET_TOP_UP), eq(901L), eq(WalletReferenceType.VNPAY_DEPOSIT)
            )).thenReturn(reserved);
            when(walletRepository.saveAndFlush(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

            walletService.topUpFromVnPay(
                    USER_ID, operationKey("deposit-scale"), new BigDecimal("100.235"), 901L);

            assertThat(wallet.getAvailableBalance()).isEqualByComparingTo("1000100.24");
            ArgumentCaptor<WalletTransaction> transactionCaptor = ArgumentCaptor.forClass(WalletTransaction.class);
            verify(walletTransactionRepository).save(transactionCaptor.capture());
            assertThat(transactionCaptor.getValue().getAmount()).isEqualByComparingTo("100.24");
            verify(walletOperationLifecycleService).markSuccess(201L);
        }

        @Test
        @DisplayName("should be idempotent for the same operation key and payload")
        void topUpFromVnPay_sameOperationKey_noop() {
            Wallet wallet = createWallet(new BigDecimal("1000000"), BigDecimal.ZERO);

            when(userRepository.existsById(USER_ID)).thenReturn(true);
            when(walletRepository.findByUserId(USER_ID)).thenReturn(Optional.of(wallet));
            when(walletOperationLifecycleService.reserveOrReuseOperation(
                    eq(10L), eq("deposit-ok"), eq(new BigDecimal("500000.00")),
                    eq(WalletTransactionType.WALLET_TOP_UP), eq(902L), eq(WalletReferenceType.VNPAY_DEPOSIT)
            )).thenReturn(null);

            walletService.topUpFromVnPay(
                    USER_ID, operationKey("deposit-ok"), new BigDecimal("500000"), 902L);

            assertThat(wallet.getAvailableBalance()).isEqualByComparingTo("1000000");
            verify(walletRepository, never()).saveAndFlush(any(Wallet.class));
            verify(walletTransactionRepository, never()).save(any(WalletTransaction.class));
        }
    }

    @Nested
    @DisplayName("freezeAuctionDeposit")
    class FreezeFunds {

        @Test
        @DisplayName("should move amount from available to frozen")
        void freezeAuctionDeposit_success() {
            Wallet wallet = createWallet(new BigDecimal("5000000"), new BigDecimal("500000"));
            WalletOperation reserved = createReservedOperation(301L, "freeze-1", WalletTransactionType.AUCTION_DEPOSIT_FREEZE);

            when(userRepository.existsById(USER_ID)).thenReturn(true);
            when(walletRepository.findByUserId(USER_ID)).thenReturn(Optional.of(wallet));
            when(walletOperationLifecycleService.reserveOrReuseOperation(
                    eq(10L), eq("freeze-1"), eq(new BigDecimal("1000000.00")),
                    eq(WalletTransactionType.AUCTION_DEPOSIT_FREEZE), eq(205L), eq(WalletReferenceType.AUCTION)
            )).thenReturn(reserved);
            when(walletRepository.saveAndFlush(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

            walletService.freezeAuctionDeposit(USER_ID, operationKey("freeze-1"), new BigDecimal("1000000"), 205L);

            assertThat(wallet.getAvailableBalance()).isEqualByComparingTo("4000000.00");
            assertThat(wallet.getFrozenBalance()).isEqualByComparingTo("1500000.00");
            ArgumentCaptor<WalletTransaction> transactionCaptor = ArgumentCaptor.forClass(WalletTransaction.class);
            verify(walletTransactionRepository).save(transactionCaptor.capture());
            assertThat(transactionCaptor.getValue().getType()).isEqualTo(WalletTransactionType.AUCTION_DEPOSIT_FREEZE);
            assertThat(transactionCaptor.getValue().getAmount()).isEqualByComparingTo("-1000000.00");
            verify(walletOperationLifecycleService).markSuccess(301L);
        }

        @Test
        @DisplayName("should reject when available balance is insufficient and finalize operation as FAILED")
        void freezeAuctionDeposit_insufficientAvailable_throws() {
            Wallet wallet = createWallet(new BigDecimal("500000"), BigDecimal.ZERO);
            WalletOperation reserved = createReservedOperation(302L, "freeze-2", WalletTransactionType.AUCTION_DEPOSIT_FREEZE);

            when(userRepository.existsById(USER_ID)).thenReturn(true);
            when(walletRepository.findByUserId(USER_ID)).thenReturn(Optional.of(wallet));
            when(walletOperationLifecycleService.reserveOrReuseOperation(
                    eq(10L), eq("freeze-2"), eq(new BigDecimal("1000000.00")),
                    eq(WalletTransactionType.AUCTION_DEPOSIT_FREEZE), eq(205L), eq(WalletReferenceType.AUCTION)
            )).thenReturn(reserved);

            assertThatThrownBy(() -> walletService.freezeAuctionDeposit(
                    USER_ID, operationKey("freeze-2"), new BigDecimal("1000000"), 205L))
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
        void freezeAuctionDeposit_missingAuctionReference_throws() {
            assertThatThrownBy(() -> walletService.freezeAuctionDeposit(
                    USER_ID, operationKey("freeze-ref"), new BigDecimal("1000000"), null))
                    .isInstanceOf(AppException.class)
                    .satisfies(throwable -> {
                        AppException exception = (AppException) throwable;
                        assertThat(exception.getStatusCode()).isEqualTo(ErrorCode.WALLET_REFERENCE_INVALID.getStatusCode());
                    });

            verifyNoInteractions(walletOperationLifecycleService);
        }

        @Test
        @DisplayName("should normalize amount before applying mutation")
        void freezeAuctionDeposit_normalizesAmount() {
            Wallet wallet = createWallet(new BigDecimal("5000000"), BigDecimal.ZERO);
            WalletOperation reserved = createReservedOperation(303L, "freeze-scale", WalletTransactionType.AUCTION_DEPOSIT_FREEZE);

            when(userRepository.existsById(USER_ID)).thenReturn(true);
            when(walletRepository.findByUserId(USER_ID)).thenReturn(Optional.of(wallet));
            when(walletOperationLifecycleService.reserveOrReuseOperation(
                    eq(10L), eq("freeze-scale"), eq(new BigDecimal("100.24")),
                    eq(WalletTransactionType.AUCTION_DEPOSIT_FREEZE), eq(205L), eq(WalletReferenceType.AUCTION)
            )).thenReturn(reserved);
            when(walletRepository.saveAndFlush(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

            walletService.freezeAuctionDeposit(USER_ID, operationKey("freeze-scale"), new BigDecimal("100.235"), 205L);

            assertThat(wallet.getAvailableBalance()).isEqualByComparingTo("4999899.76");
            assertThat(wallet.getFrozenBalance()).isEqualByComparingTo("100.24");
        }

        @Test
        @DisplayName("should map optimistic lock failure to retryable business error and finalize FAILED")
        void freezeAuctionDeposit_concurrentModification_throwsRetryableError() {
            Wallet wallet = createWallet(new BigDecimal("5000000"), BigDecimal.ZERO);
            WalletOperation reserved = createReservedOperation(304L, "freeze-conflict", WalletTransactionType.AUCTION_DEPOSIT_FREEZE);

            when(userRepository.existsById(USER_ID)).thenReturn(true);
            when(walletRepository.findByUserId(USER_ID)).thenReturn(Optional.of(wallet));
            when(walletOperationLifecycleService.reserveOrReuseOperation(
                    eq(10L), eq("freeze-conflict"), eq(new BigDecimal("1000000.00")),
                    eq(WalletTransactionType.AUCTION_DEPOSIT_FREEZE), eq(205L), eq(WalletReferenceType.AUCTION)
            )).thenReturn(reserved);
            when(walletRepository.saveAndFlush(any(Wallet.class)))
                    .thenThrow(new ObjectOptimisticLockingFailureException(Wallet.class, 10L));

            assertThatThrownBy(() -> walletService.freezeAuctionDeposit(
                    USER_ID, operationKey("freeze-conflict"), new BigDecimal("1000000"), 205L))
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
        void freezeAuctionDeposit_transactionLogFailure_marksFailed() {
            Wallet wallet = createWallet(new BigDecimal("5000000"), BigDecimal.ZERO);
            WalletOperation reserved = createReservedOperation(305L, "freeze-log-fail", WalletTransactionType.AUCTION_DEPOSIT_FREEZE);

            when(userRepository.existsById(USER_ID)).thenReturn(true);
            when(walletRepository.findByUserId(USER_ID)).thenReturn(Optional.of(wallet));
            when(walletOperationLifecycleService.reserveOrReuseOperation(
                    eq(10L), eq("freeze-log-fail"), eq(new BigDecimal("1000000.00")),
                    eq(WalletTransactionType.AUCTION_DEPOSIT_FREEZE), eq(205L), eq(WalletReferenceType.AUCTION)
            )).thenReturn(reserved);
            when(walletRepository.saveAndFlush(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(walletTransactionRepository.save(any(WalletTransaction.class)))
                    .thenThrow(new IllegalStateException("transaction-log failure"));

            assertThatThrownBy(() -> walletService.freezeAuctionDeposit(
                    USER_ID, operationKey("freeze-log-fail"), new BigDecimal("1000000"), 205L))
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
    @DisplayName("releaseAuctionDeposit")
    class UnfreezeAuctionDeposit {

        @Test
        @DisplayName("should move amount from frozen back to available")
        void releaseAuctionDeposit_success() {
            Wallet wallet = createWallet(new BigDecimal("1000000"), new BigDecimal("3000000"));
            WalletOperation reserved = createReservedOperation(401L, "unfreeze-1", WalletTransactionType.AUCTION_DEPOSIT_RELEASE);

            when(userRepository.existsById(USER_ID)).thenReturn(true);
            when(walletRepository.findByUserId(USER_ID)).thenReturn(Optional.of(wallet));
            when(walletOperationLifecycleService.reserveOrReuseOperation(
                    eq(10L), eq("unfreeze-1"), eq(new BigDecimal("500000.00")),
                    eq(WalletTransactionType.AUCTION_DEPOSIT_RELEASE), eq(205L), eq(WalletReferenceType.AUCTION)
            )).thenReturn(reserved);
            when(walletRepository.saveAndFlush(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

            walletService.releaseAuctionDeposit(
                    USER_ID, operationKey("unfreeze-1"), new BigDecimal("500000"), 205L);

            assertThat(wallet.getAvailableBalance()).isEqualByComparingTo("1500000.00");
            assertThat(wallet.getFrozenBalance()).isEqualByComparingTo("2500000.00");
            verify(walletOperationLifecycleService).markSuccess(401L);
        }
    }

    @Nested
    @DisplayName("captureAuctionDeposit")
    class DeductFrozenFunds {

        @Test
        @DisplayName("should deduct amount from frozen balance and log PAYMENT")
        void captureAuctionDeposit_success() {
            Wallet wallet = createWallet(new BigDecimal("2000000"), new BigDecimal("4000000"));
            WalletOperation reserved = createReservedOperation(
                    501L, "deduct-1", WalletTransactionType.AUCTION_DEPOSIT_CAPTURE);

            when(userRepository.existsById(USER_ID)).thenReturn(true);
            when(walletRepository.findByUserId(USER_ID)).thenReturn(Optional.of(wallet));
            when(walletOperationLifecycleService.reserveOrReuseOperation(
                    eq(10L), eq("deduct-1"), eq(new BigDecimal("1500000.00")),
                    eq(WalletTransactionType.AUCTION_DEPOSIT_CAPTURE), eq(205L), eq(WalletReferenceType.AUCTION)
            )).thenReturn(reserved);
            when(walletRepository.saveAndFlush(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

            walletService.captureAuctionDeposit(USER_ID, operationKey("deduct-1"), new BigDecimal("1500000"), 205L);

            assertThat(wallet.getAvailableBalance()).isEqualByComparingTo("2000000");
            assertThat(wallet.getFrozenBalance()).isEqualByComparingTo("2500000.00");
            ArgumentCaptor<WalletTransaction> transactionCaptor = ArgumentCaptor.forClass(WalletTransaction.class);
            verify(walletTransactionRepository).save(transactionCaptor.capture());
            assertThat(transactionCaptor.getValue().getType())
                    .isEqualTo(WalletTransactionType.AUCTION_DEPOSIT_CAPTURE);
            assertThat(transactionCaptor.getValue().getAmount()).isEqualByComparingTo("-1500000.00");
            verify(walletOperationLifecycleService).markSuccess(501L);
        }
    }

    @Nested
    @DisplayName("refundOrder")
    class RefundFunds {

        @Test
        @DisplayName("should add amount to available balance and log REFUND")
        void refundOrder_success() {
            Wallet wallet = createWallet(new BigDecimal("2000000"), BigDecimal.ZERO);
            WalletOperation reserved = createReservedOperation(601L, "refund-1", WalletTransactionType.ORDER_REFUND);

            when(userRepository.existsById(USER_ID)).thenReturn(true);
            when(walletRepository.findByUserId(USER_ID)).thenReturn(Optional.of(wallet));
            when(walletOperationLifecycleService.reserveOrReuseOperation(
                    eq(10L), eq("refund-1"), eq(new BigDecimal("3000000.00")),
                    eq(WalletTransactionType.ORDER_REFUND), eq(91L), eq(WalletReferenceType.ORDER)
            )).thenReturn(reserved);
            when(walletRepository.saveAndFlush(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

            walletService.refundOrder(
                    USER_ID,
                    operationKey("refund-1"),
                    new BigDecimal("3000000"),
                    91L);

            assertThat(wallet.getAvailableBalance()).isEqualByComparingTo("5000000.00");
            ArgumentCaptor<WalletTransaction> transactionCaptor = ArgumentCaptor.forClass(WalletTransaction.class);
            verify(walletTransactionRepository).save(transactionCaptor.capture());
            assertThat(transactionCaptor.getValue().getType()).isEqualTo(WalletTransactionType.ORDER_REFUND);
            assertThat(transactionCaptor.getValue().getAmount()).isEqualByComparingTo("3000000.00");
            verify(walletOperationLifecycleService).markSuccess(601L);
        }
    }

    @Nested
    @DisplayName("payOrder")
    class PayFunds {

        @Test
        @DisplayName("should deduct amount from available balance and log PAYMENT")
        void payOrder_success() {
            Wallet wallet = createWallet(new BigDecimal("5000000"), BigDecimal.ZERO);
            WalletOperation reserved = createReservedOperation(701L, "pay-1", WalletTransactionType.ORDER_PAYMENT);

            when(userRepository.existsById(USER_ID)).thenReturn(true);
            when(walletRepository.findByUserId(USER_ID)).thenReturn(Optional.of(wallet));
            when(walletOperationLifecycleService.reserveOrReuseOperation(
                    eq(10L), eq("pay-1"), eq(new BigDecimal("1500000.00")),
                    eq(WalletTransactionType.ORDER_PAYMENT), eq(91L), eq(WalletReferenceType.ORDER)
            )).thenReturn(reserved);
            when(walletRepository.saveAndFlush(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));

            walletService.payOrder(
                    USER_ID,
                    operationKey("pay-1"),
                    new BigDecimal("1500000"),
                    91L);

            assertThat(wallet.getAvailableBalance()).isEqualByComparingTo("3500000.00");
            ArgumentCaptor<WalletTransaction> transactionCaptor = ArgumentCaptor.forClass(WalletTransaction.class);
            verify(walletTransactionRepository).save(transactionCaptor.capture());
            assertThat(transactionCaptor.getValue().getType()).isEqualTo(WalletTransactionType.ORDER_PAYMENT);
            assertThat(transactionCaptor.getValue().getAmount()).isEqualByComparingTo("-1500000.00");
            verify(walletOperationLifecycleService).markSuccess(701L);
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
            tx.setType(WalletTransactionType.WALLET_TOP_UP);
            tx.setReferenceType(WalletReferenceType.VNPAY_DEPOSIT);
            tx.setStatus(WalletTransactionStatus.SUCCESS);
            tx.setCreatedAt(Instant.parse("2026-04-19T03:00:00Z"));

            when(userRepository.existsById(USER_ID)).thenReturn(true);
            when(walletRepository.findByUserId(USER_ID)).thenReturn(Optional.of(wallet));
            when(walletTransactionRepository.findByWalletIdOrderByCreatedAtDescIdDesc(eq(10L), any(PageRequest.class)))
                    .thenReturn(new PageImpl<>(List.of(tx), PageRequest.of(0, 10), 1));

            var result = walletService.getMyTransactions(USER_ID, 1, 10);

            assertThat(result.result()).hasSize(1);
            assertThat(result.result().get(0).id()).isEqualTo(99L);
            assertThat(result.result().get(0).type()).isEqualTo(WalletTransactionType.WALLET_TOP_UP);
        }
    }
}
