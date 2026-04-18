package com.woodcert.auction.feature.catalog.dto.response;

import com.woodcert.auction.feature.catalog.entity.Product;
import com.woodcert.auction.feature.catalog.entity.ProductStatus;

import java.time.Instant;

/**
 * Product list item DTO — used for paginated list endpoints.
 * Lightweight: only essentials for browse/filter views.
 */
public record ProductListRes(
        Long id,
        String title,
        CategoryRes category,
        ProductStatus status,
        String primaryImage,
        Instant createdAt
) {
    public static ProductListRes fromEntity(Product product, String primaryImageUrl) {
        CategoryRes categoryRes = null;
        if (product.getCategory() != null) {
            categoryRes = CategoryRes.fromEntity(product.getCategory());
        }
        return new ProductListRes(
                product.getId(),
                product.getTitle(),
                categoryRes,
                product.getStatus(),
                primaryImageUrl,
                product.getCreatedAt()
        );
    }
}
