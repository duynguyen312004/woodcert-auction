package com.woodcert.auction.feature.catalog.dto.response;

import com.woodcert.auction.feature.catalog.entity.Category;
import com.woodcert.auction.feature.catalog.entity.Product;
import com.woodcert.auction.feature.catalog.entity.ProductSaleStatus;
import com.woodcert.auction.feature.catalog.entity.ProductStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Full product detail DTO — used for single product view.
 * Aggregates Product + Seller + Images + AppraisalReport.
 */
public record ProductDetailRes(
        Long id,
        SellerSummaryRes seller,
        String title,
        String description,
        String material,
        String dimensions,
        BigDecimal weight,
        ProductStatus status,
        ProductSaleStatus saleStatus,
        CategoryRes category,
        List<ProductImageRes> images,
        AppraisalReportRes appraisalReport,
        Instant submittedAt,
        String appraisalClaimedBy,
        Instant appraisalClaimedAt,
        Instant appraisalClaimExpiresAt,
        String rejectedReason,
        Instant createdAt
) {
    public static ProductDetailRes fromEntity(
            Product product,
            SellerSummaryRes sellerSummary,
            List<ProductImageRes> imageResponses,
            AppraisalReportRes appraisalReportRes,
            Category category) {
        CategoryRes categoryRes = category != null ? CategoryRes.fromEntity(category) : null;
        return new ProductDetailRes(
                product.getId(),
                sellerSummary,
                product.getTitle(),
                product.getDescription(),
                product.getMaterial(),
                product.getDimensions(),
                product.getWeight(),
                product.getStatus(),
                product.getSaleStatus(),
                categoryRes,
                imageResponses,
                appraisalReportRes,
                product.getSubmittedAt(),
                product.getAppraisalClaimedBy(),
                product.getAppraisalClaimedAt(),
                product.getAppraisalClaimExpiresAt(),
                product.getRejectedReason(),
                product.getCreatedAt()
        );
    }
}
