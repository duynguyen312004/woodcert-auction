package com.woodcert.auction.feature.catalog.repository;

import com.woodcert.auction.feature.catalog.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {

    List<ProductImage> findByProductIdOrderBySortOrderAsc(Long productId);

    void deleteByProductId(Long productId);

    /**
     * Batch-load candidate images (with media asset eagerly fetched) for a set of product IDs.
     * Ordered so callers can prefer isPrimary=true, then fall back to the first image.
     */
    @Query("""
            SELECT pi FROM ProductImage pi
            LEFT JOIN FETCH pi.mediaAsset
            WHERE pi.productId IN :productIds
            ORDER BY pi.productId ASC, pi.sortOrder ASC
            """)
    List<ProductImage> findImagesByProductIdsOrderByProductIdAscSortOrderAsc(
            @Param("productIds") Collection<Long> productIds);
}
