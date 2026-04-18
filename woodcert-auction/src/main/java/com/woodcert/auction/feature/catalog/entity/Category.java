package com.woodcert.auction.feature.catalog.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * Category entity — maps to 'categories' table.
 * Supports self-referencing hierarchy via parent_id.
 * Does NOT extend BaseEntity (no audit columns in DB schema).
 */
@Getter
@Setter
@Entity
@Table(name = "categories", indexes = {
        @Index(name = "idx_categories_parent_id", columnList = "parent_id")
})
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "name", nullable = false, unique = true, length = 100)
    private String name;

    @Column(name = "slug", nullable = false, unique = true, length = 100)
    private String slug;

    @Column(name = "parent_id")
    private Integer parentId;

    @Column(name = "description", length = 255)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id", insertable = false, updatable = false)
    private Category parent;
}
