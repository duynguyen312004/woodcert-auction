package com.woodcert.auction.feature.finance.entity;

import com.woodcert.auction.core.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "platform_revenue_transactions", indexes = {
        @Index(name = "idx_platform_revenue_type", columnList = "type"),
        @Index(name = "idx_platform_revenue_reference", columnList = "reference_type,reference_id"),
        @Index(name = "idx_platform_revenue_source_user", columnList = "source_user_id")
})
public class PlatformRevenueTransaction extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 40)
    private PlatformRevenueType type;

    @Column(name = "amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(name = "source_user_id", length = 36)
    private String sourceUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "reference_type", nullable = false, length = 40)
    private WalletReferenceType referenceType;

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "operation_key", nullable = false, unique = true, length = 160)
    private String operationKey;
}
