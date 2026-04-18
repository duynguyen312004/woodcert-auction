package com.woodcert.auction.feature.catalog.dto.response;

import com.woodcert.auction.feature.catalog.entity.Category;

/**
 * Category response DTO.
 */
public record CategoryRes(
        Integer id,
        String name,
        String slug,
        Integer parentId,
        String description
) {
    public static CategoryRes fromEntity(Category category) {
        return new CategoryRes(
                category.getId(),
                category.getName(),
                category.getSlug(),
                category.getParentId(),
                category.getDescription()
        );
    }
}
