package com.woodcert.auction.feature.catalog.entity;

import com.woodcert.auction.feature.media.entity.MediaAsset;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * Product image entity — maps to 'product_images' table.
 * Uses media_id FK → media_assets(id) for Cloudinary integration.
 * Does NOT extend BaseEntity (no audit columns in DB schema).
 */
@Getter
@Setter
@Entity
@Table(name = "product_images", indexes = {
        @Index(name = "idx_product_images_product_id", columnList = "product_id")
})
public class ProductImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "media_id", nullable = false)
    private Long mediaId;

    @Column(name = "is_primary", nullable = false)
    private boolean isPrimary;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    // --- Relationships ---

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", insertable = false, updatable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "media_id", insertable = false, updatable = false)
    private MediaAsset mediaAsset;
}
