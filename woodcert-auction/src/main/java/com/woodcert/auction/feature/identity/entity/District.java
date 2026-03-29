package com.woodcert.auction.feature.identity.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * District master data entity — maps to 'districts' table.
 * PK is code (VARCHAR 20), FK → provinces(code).
 * Does NOT extend BaseEntity (no audit columns).
 */
@Getter
@Setter
@Entity
@Table(name = "districts", indexes = {
        @Index(name = "idx_districts_province_code", columnList = "province_code")
})
public class District {

    @Id
    @Column(name = "code", length = 20)
    private String code;

    @Column(name = "province_code", nullable = false, length = 20)
    private String provinceCode;

    @Column(name = "name", nullable = false, length = 100)
    private String name;
}
