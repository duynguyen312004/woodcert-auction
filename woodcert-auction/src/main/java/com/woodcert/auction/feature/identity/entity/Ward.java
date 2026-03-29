package com.woodcert.auction.feature.identity.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * Ward master data entity — maps to 'wards' table.
 * PK is code (VARCHAR 20), FK → districts(code).
 * Does NOT extend BaseEntity (no audit columns).
 */
@Getter
@Setter
@Entity
@Table(name = "wards", indexes = {
        @Index(name = "idx_wards_district_code", columnList = "district_code")
})
public class Ward {

    @Id
    @Column(name = "code", length = 20)
    private String code;

    @Column(name = "district_code", nullable = false, length = 20)
    private String districtCode;

    @Column(name = "name", nullable = false, length = 100)
    private String name;
}
