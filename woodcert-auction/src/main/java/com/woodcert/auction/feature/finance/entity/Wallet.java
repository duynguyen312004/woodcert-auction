package com.woodcert.auction.feature.finance.entity;

import com.woodcert.auction.feature.identity.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Wallet entity mapped to the `wallets` table.
 * One user owns exactly one wallet, created lazily on first access.
 */
@Getter
@Setter
@Entity
@Table(name = "wallets", indexes = {
        @Index(name = "idx_wallets_user_id", columnList = "user_id", unique = true)
})
public class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true, length = 36)
    private String userId;

    @Column(name = "available_balance", nullable = false, precision = 19, scale = 2)
    private BigDecimal availableBalance = BigDecimal.ZERO;

    @Column(name = "frozen_balance", nullable = false, precision = 19, scale = 2)
    private BigDecimal frozenBalance = BigDecimal.ZERO;

    @Version
    @Column(name = "version", nullable = false)
    private Integer version;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;
}
