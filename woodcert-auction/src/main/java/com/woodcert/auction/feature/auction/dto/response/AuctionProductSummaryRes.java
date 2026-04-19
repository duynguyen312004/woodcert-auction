package com.woodcert.auction.feature.auction.dto.response;

import com.woodcert.auction.feature.catalog.entity.Product;

import java.math.BigDecimal;
import java.util.List;

/**
 * Public product snapshot embedded in auction detail.
 */
public record AuctionProductSummaryRes(
        Long id,
        String title,
        String description,
        String material,
        String dimensions,
        BigDecimal weight,
        String primaryImage,
        List<String> images,
        AuctionAppraisalRes appraisal
) {
    public static AuctionProductSummaryRes fromEntity(
            Product product,
            String publicMaterial,
            String primaryImage,
            List<String> images,
            AuctionAppraisalRes appraisal) {
        return new AuctionProductSummaryRes(
                product.getId(),
                product.getTitle(),
                product.getDescription(),
                publicMaterial,
                product.getDimensions(),
                product.getWeight(),
                primaryImage,
                images,
                appraisal
        );
    }
}
