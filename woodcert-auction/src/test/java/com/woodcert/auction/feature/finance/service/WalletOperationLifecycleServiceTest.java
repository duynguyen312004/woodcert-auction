package com.woodcert.auction.feature.finance.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.finance.config.FinanceProperties;
import com.woodcert.auction.feature.finance.entity.WalletOperation;
import com.woodcert.auction.feature.finance.entity.WalletReferenceType;
import com.woodcert.auction.feature.finance.entity.WalletTransactionStatus;
import com.woodcert.auction.feature.finance.entity.WalletTransactionType;
import com.woodcert.auction.feature.finance.repository.WalletOperationRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WalletOperationLifecycleServiceTest {

    @Mock private WalletOperationRepository walletOperationRepository;
    @Mock private FinanceProperties financeProperties;

    @InjectMocks
    private WalletOperationLifecycleService walletOperationLifecycleService;

    @Test
    @DisplayName("should reserve a new pending operation when operation key is unused")
    void reserveOrReuseOperation_createsPendingOperation() {
        when(walletOperationRepository.findByOperationKey("freeze-1")).thenReturn(Optional.empty());
        when(walletOperationRepository.saveAndFlush(any(WalletOperation.class))).thenAnswer(invocation -> {
            WalletOperation operation = invocation.getArgument(0);
            operation.setId(100L);
            return operation;
        });

        WalletOperation result = walletOperationLifecycleService.reserveOrReuseOperation(
                10L,
                "freeze-1",
                new BigDecimal("1000000.00"),
                WalletTransactionType.FREEZE,
                205L,
                WalletReferenceType.AUCTION
        );

        assertThat(result.getId()).isEqualTo(100L);
        assertThat(result.getStatus()).isEqualTo(WalletTransactionStatus.PENDING);
        assertThat(result.getAmount()).isEqualByComparingTo("1000000.00");
    }

    @Test
    @DisplayName("should return null for an already successful matching operation")
    void reserveOrReuseOperation_existingSuccess_returnsNull() {
        WalletOperation existing = existingOperation(WalletTransactionStatus.SUCCESS);
        when(walletOperationRepository.findByOperationKey("freeze-1")).thenReturn(Optional.of(existing));

        WalletOperation result = walletOperationLifecycleService.reserveOrReuseOperation(
                10L,
                "freeze-1",
                new BigDecimal("1000000.00"),
                WalletTransactionType.FREEZE,
                205L,
                WalletReferenceType.AUCTION
        );

        assertThat(result).isNull();
    }

    @Test
    @DisplayName("should reject reused operation key with a different payload")
    void reserveOrReuseOperation_payloadMismatch_throws() {
        WalletOperation existing = existingOperation(WalletTransactionStatus.SUCCESS);
        when(walletOperationRepository.findByOperationKey("freeze-1")).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> walletOperationLifecycleService.reserveOrReuseOperation(
                10L,
                "freeze-1",
                new BigDecimal("1500000.00"),
                WalletTransactionType.FREEZE,
                205L,
                WalletReferenceType.AUCTION
        )).isInstanceOf(AppException.class)
                .satisfies(throwable -> {
                    AppException exception = (AppException) throwable;
                    assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.WALLET_OPERATION_PAYLOAD_MISMATCH);
                });
    }

    @Test
    @DisplayName("should reject when a matching operation has already failed")
    void reserveOrReuseOperation_existingFailed_throws() {
        WalletOperation existing = existingOperation(WalletTransactionStatus.FAILED);
        when(walletOperationRepository.findByOperationKey("freeze-1")).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> walletOperationLifecycleService.reserveOrReuseOperation(
                10L,
                "freeze-1",
                new BigDecimal("1000000.00"),
                WalletTransactionType.FREEZE,
                205L,
                WalletReferenceType.AUCTION
        )).isInstanceOf(AppException.class)
                .satisfies(throwable -> {
                    AppException exception = (AppException) throwable;
                    assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.WALLET_OPERATION_ALREADY_FAILED);
                });
    }

    @Test
    @DisplayName("should retry a matching operation after insufficient available balance")
    void reserveOrReuseOperation_retryableFailure_resetsToPending() {
        WalletOperation existing = existingOperation(WalletTransactionStatus.FAILED);
        existing.setFailureCode(ErrorCode.WALLET_INSUFFICIENT_AVAILABLE_BALANCE.name());
        existing.setFailureMessage(ErrorCode.WALLET_INSUFFICIENT_AVAILABLE_BALANCE.getMessage());
        when(walletOperationRepository.findByOperationKey("freeze-1")).thenReturn(Optional.of(existing));
        when(walletOperationRepository.saveAndFlush(existing)).thenReturn(existing);

        WalletOperation result = walletOperationLifecycleService.reserveOrReuseOperation(
                10L,
                "freeze-1",
                new BigDecimal("1000000.00"),
                WalletTransactionType.FREEZE,
                205L,
                WalletReferenceType.AUCTION
        );

        assertThat(result).isSameAs(existing);
        assertThat(result.getStatus()).isEqualTo(WalletTransactionStatus.PENDING);
        assertThat(result.getFailureCode()).isNull();
        assertThat(result.getFailureMessage()).isNull();
        verify(walletOperationRepository).saveAndFlush(existing);
    }

    @Test
    @DisplayName("should reject fresh pending operations as in progress")
    void reserveOrReuseOperation_freshPending_throws() {
        when(financeProperties.getWalletOperationPendingTimeout()).thenReturn(Duration.ofMinutes(5));
        WalletOperation existing = existingOperation(WalletTransactionStatus.PENDING);
        existing.setUpdatedAt(Instant.now().minusSeconds(30));
        when(walletOperationRepository.findByOperationKey("freeze-1")).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> walletOperationLifecycleService.reserveOrReuseOperation(
                10L,
                "freeze-1",
                new BigDecimal("1000000.00"),
                WalletTransactionType.FREEZE,
                205L,
                WalletReferenceType.AUCTION
        )).isInstanceOf(AppException.class)
                .satisfies(throwable -> {
                    AppException exception = (AppException) throwable;
                    assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.WALLET_OPERATION_IN_PROGRESS);
                });

        verify(walletOperationRepository, never()).save(any(WalletOperation.class));
    }

    @Test
    @DisplayName("should mark stale pending operations as failed and reject reuse")
    void reserveOrReuseOperation_stalePending_marksFailedAndThrows() {
        when(financeProperties.getWalletOperationPendingTimeout()).thenReturn(Duration.ofMinutes(5));
        WalletOperation existing = existingOperation(WalletTransactionStatus.PENDING);
        existing.setUpdatedAt(Instant.now().minus(Duration.ofMinutes(10)));
        when(walletOperationRepository.findByOperationKey("freeze-1")).thenReturn(Optional.of(existing));
        when(walletOperationRepository.findById(200L)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> walletOperationLifecycleService.reserveOrReuseOperation(
                10L,
                "freeze-1",
                new BigDecimal("1000000.00"),
                WalletTransactionType.FREEZE,
                205L,
                WalletReferenceType.AUCTION
        )).isInstanceOf(AppException.class)
                .satisfies(throwable -> {
                    AppException exception = (AppException) throwable;
                    assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.WALLET_OPERATION_ALREADY_FAILED);
                });

        ArgumentCaptor<WalletOperation> operationCaptor = ArgumentCaptor.forClass(WalletOperation.class);
        verify(walletOperationRepository).save(operationCaptor.capture());
        assertThat(operationCaptor.getValue().getStatus()).isEqualTo(WalletTransactionStatus.FAILED);
        assertThat(operationCaptor.getValue().getFailureCode()).isEqualTo("STALE_PENDING_TIMEOUT");
    }

    @Test
    @DisplayName("should mark pending operation as success")
    void markSuccess_updatesPendingOperation() {
        WalletOperation existing = existingOperation(WalletTransactionStatus.PENDING);
        existing.setFailureCode("OLD");
        existing.setFailureMessage("old");
        when(walletOperationRepository.findById(200L)).thenReturn(Optional.of(existing));

        walletOperationLifecycleService.markSuccess(200L);

        ArgumentCaptor<WalletOperation> operationCaptor = ArgumentCaptor.forClass(WalletOperation.class);
        verify(walletOperationRepository).save(operationCaptor.capture());
        assertThat(operationCaptor.getValue().getStatus()).isEqualTo(WalletTransactionStatus.SUCCESS);
        assertThat(operationCaptor.getValue().getFailureCode()).isNull();
        assertThat(operationCaptor.getValue().getFailureMessage()).isNull();
    }

    @Test
    @DisplayName("should mark pending operation as failed with normalized metadata")
    void markFailed_updatesPendingOperation() {
        WalletOperation existing = existingOperation(WalletTransactionStatus.PENDING);
        when(walletOperationRepository.findById(200L)).thenReturn(Optional.of(existing));

        walletOperationLifecycleService.markFailed(200L, "  CUSTOM_FAILURE  ", "  detailed failure  ");

        ArgumentCaptor<WalletOperation> operationCaptor = ArgumentCaptor.forClass(WalletOperation.class);
        verify(walletOperationRepository).save(operationCaptor.capture());
        assertThat(operationCaptor.getValue().getStatus()).isEqualTo(WalletTransactionStatus.FAILED);
        assertThat(operationCaptor.getValue().getFailureCode()).isEqualTo("CUSTOM_FAILURE");
        assertThat(operationCaptor.getValue().getFailureMessage()).isEqualTo("detailed failure");
    }

    private WalletOperation existingOperation(WalletTransactionStatus status) {
        WalletOperation operation = new WalletOperation();
        operation.setId(200L);
        operation.setOperationKey("freeze-1");
        operation.setWalletId(10L);
        operation.setType(WalletTransactionType.FREEZE);
        operation.setAmount(new BigDecimal("1000000.00"));
        operation.setReferenceId(205L);
        operation.setReferenceType(WalletReferenceType.AUCTION);
        operation.setStatus(status);
        operation.setCreatedAt(Instant.now().minusSeconds(60));
        operation.setUpdatedAt(Instant.now().minusSeconds(60));
        return operation;
    }
}
