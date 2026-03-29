package com.woodcert.auction.feature.identity.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * Province master data entity — maps to 'provinces' table.
 * PK is code (VARCHAR 20), not auto-increment.
 * Imported from external data scripts.
 * Does NOT extend BaseEntity (no audit columns).
 */
@Getter
@Setter
@Entity
@Table(name = "provinces")
public class Province {

    @Id
    @Column(name = "code", length = 20)
    private String code;

    @Column(name = "name", nullable = false, length = 100)
    private String name;
}
