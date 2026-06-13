package com.woodcert.auction.feature.finance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Append-only wallet transaction audit log.
 * Every successful balance mutation must insert one row here.
 */
@Getter
@Setter
@Entity
@Table(name = "wallet_transactions", indexes = {
        @Index(name = "idx_wallet_transactions_wallet_id", columnList = "wallet_id"),
        @Index(name = "idx_wallet_transactions_created_at", columnList = "created_at"),
        @Index(name = "idx_wallet_transactions_reference", columnList = "reference_type,reference_id")
})
public class WalletTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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
    @Column(name = "reference_type", length = 20)
    private WalletReferenceType referenceType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private WalletTransactionStatus status;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wallet_id", insertable = false, updatable = false)
    private Wallet wallet;
}
