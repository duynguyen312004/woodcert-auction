package com.woodcert.auction.feature.identity.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Seller profile entity — maps to 'seller_profiles' table.
 * 1-to-1 relationship with User; shares the same PK (user_id).
 * Does NOT extend BaseEntity (no audit columns in DB).
 */
@Getter
@Setter
@Entity
@Table(name = "seller_profiles")
public class SellerProfile {

    @Id
    @Column(name = "user_id", length = 36)
    private String userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "store_name", nullable = false, length = 100)
    private String storeName;

    @Column(name = "identity_card_number", nullable = false, unique = true, length = 20)
    private String identityCardNumber;

    @Column(name = "tax_code", length = 50)
    private String taxCode;

    @Column(name = "reputation_score", nullable = false, precision = 3, scale = 2)
    private BigDecimal reputationScore = new BigDecimal("5.00");
}
