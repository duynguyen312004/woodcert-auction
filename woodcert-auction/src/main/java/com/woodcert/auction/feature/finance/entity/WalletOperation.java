package com.woodcert.auction.feature.finance.entity;

import com.woodcert.auction.core.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Idempotent wallet business-operation record.
 * Used to prevent duplicate balance mutations on retries or duplicate events.
 */
@Getter
@Setter
@Entity
@Table(name = "wallet_operations", indexes = {
        @Index(name = "idx_wallet_operations_wallet_id", columnList = "wallet_id"),
        @Index(name = "idx_wallet_operations_operation_key", columnList = "operation_key", unique = true)
})
public class WalletOperation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "operation_key", nullable = false, unique = true, length = 200)
    private String operationKey;

    @Column(name = "wallet_id", nullable = false)
    private Long walletId;

    @Column(name = "amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 40)
    private WalletTransactionType type;

    @Column(name = "reference_id")
    private Long referenceId;

    @Enumerated(EnumType.STRING)
    @Column(name = "reference_type", nullable = false, length = 20)
    private WalletReferenceType referenceType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private WalletTransactionStatus status;

    @Column(name = "failure_code", length = 100)
    private String failureCode;

    @Column(name = "failure_message", length = 255)
    private String failureMessage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wallet_id", insertable = false, updatable = false)
    private Wallet wallet;
}
