package com.woodcert.auction.feature.catalog.dto.response;

import com.woodcert.auction.feature.catalog.entity.ProductSaleStatus;
import com.woodcert.auction.feature.catalog.entity.ProductStatus;

import java.util.Map;

public record SellerProductStatsRes(
        long total,
        Map<ProductStatus, Long> byStatus,
        Map<ProductSaleStatus, Long> bySaleStatus
) {
}
