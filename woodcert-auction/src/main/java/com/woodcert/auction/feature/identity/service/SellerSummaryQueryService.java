package com.woodcert.auction.feature.identity.service;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;

public interface SellerSummaryQueryService {

    Map<String, SellerSummary> findSellerSummaries(Collection<String> sellerIds);

    default Optional<SellerSummary> findSellerSummary(String sellerId) {
        if (sellerId == null || sellerId.isBlank()) {
            return Optional.empty();
        }
        return Optional.ofNullable(findSellerSummaries(java.util.List.of(sellerId)).get(sellerId));
    }

    record SellerSummary(
            String displayName,
            BigDecimal reputationScore
    ) {
    }
}
