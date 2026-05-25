package com.woodcert.auction.feature.catalog.dto.response;

import com.woodcert.auction.feature.catalog.entity.Product;
import com.woodcert.auction.feature.catalog.entity.ProductSaleStatus;
import com.woodcert.auction.feature.catalog.entity.ProductStatus;

import java.time.Instant;

/**
 * DTO một sản phẩm trong danh sách catalog có phân trang.
 *
 * Response này cố ý giữ gọn để dùng cho màn duyệt/lọc, màn seller chọn sản
 * phẩm và các nơi chỉ cần ảnh chính cùng thông tin tóm tắt.
 */
public record ProductListRes(
        Long id,
        String title,
        CategoryRes category,
        String material,
        ProductStatus status,
        ProductSaleStatus saleStatus,
        String primaryImage,
        Instant createdAt,
        Instant submittedAt,
        String appraisalClaimedBy,
        Instant appraisalClaimedAt,
        Instant appraisalClaimExpiresAt
) {
    /**
     * Map Product sang response danh sách, còn ảnh chính do caller truyền vào.
     */
    public static ProductListRes fromEntity(Product product, String primaryImageUrl) {
        CategoryRes categoryRes = null;
        if (product.getCategory() != null) {
            categoryRes = CategoryRes.fromEntity(product.getCategory());
        }
        return new ProductListRes(
                product.getId(),
                product.getTitle(),
                categoryRes,
                product.getMaterial(),
                product.getStatus(),
                product.getSaleStatus(),
                primaryImageUrl,
                product.getCreatedAt(),
                product.getSubmittedAt(),
                product.getAppraisalClaimedBy(),
                product.getAppraisalClaimedAt(),
                product.getAppraisalClaimExpiresAt()
        );
    }
}
