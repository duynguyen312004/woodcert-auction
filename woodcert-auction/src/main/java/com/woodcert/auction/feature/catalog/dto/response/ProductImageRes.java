package com.woodcert.auction.feature.catalog.dto.response;

import com.woodcert.auction.feature.catalog.entity.ProductImage;

/**
 * Product image response DTO.
 * imageUrl is generated dynamically from the linked media asset, not stored directly.
 */
public record ProductImageRes(
        Long id,
        Long mediaId,
        String imageUrl,
        boolean isPrimary,
        int sortOrder
) {
    public static ProductImageRes fromEntity(ProductImage image, String imageUrl) {
        return new ProductImageRes(
                image.getId(),
                image.getMediaId(),
                imageUrl,
                image.isPrimary(),
                image.getSortOrder()
        );
    }
}
