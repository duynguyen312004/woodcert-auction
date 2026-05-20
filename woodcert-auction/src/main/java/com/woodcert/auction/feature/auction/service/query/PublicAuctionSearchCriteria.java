package com.woodcert.auction.feature.auction.service.query;

import java.math.BigDecimal;

public record PublicAuctionSearchCriteria(
        int page,
        int size,
        String status,
        String material,
        String categoryName,
        BigDecimal priceMin,
        BigDecimal priceMax
) {
}
