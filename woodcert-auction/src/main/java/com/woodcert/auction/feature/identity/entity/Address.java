package com.woodcert.auction.feature.identity.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * Shipping address entity — maps to 'addresses' table.
 * Each user can have multiple addresses; at most one is_default = true.
 * Location codes (province/district/ward) stored as String references
 * to master data tables — validated at service layer.
 * Does NOT extend BaseEntity (no audit columns in DB).
 */
@Getter
@Setter
@Entity
@Table(name = "addresses", indexes = {
        @Index(name = "idx_addresses_user_id", columnList = "user_id"),
        @Index(name = "idx_addresses_province_code", columnList = "province_code"),
        @Index(name = "idx_addresses_district_code", columnList = "district_code"),
        @Index(name = "idx_addresses_ward_code", columnList = "ward_code")
})
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "receiver_name", nullable = false, length = 100)
    private String receiverName;

    @Column(name = "phone_number", nullable = false, length = 20)
    private String phoneNumber;

    @Column(name = "street_address", nullable = false, length = 255)
    private String streetAddress;

    @Column(name = "province_code", length = 20)
    private String provinceCode;

    @Column(name = "district_code", length = 20)
    private String districtCode;

    @Column(name = "ward_code", length = 20)
    private String wardCode;

    @Column(name = "is_default", nullable = false)
    private boolean isDefault = false;
}
