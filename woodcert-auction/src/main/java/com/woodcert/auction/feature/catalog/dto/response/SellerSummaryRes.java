package com.woodcert.auction.feature.catalog.dto.response;

import com.woodcert.auction.feature.identity.entity.SellerProfile;
import com.woodcert.auction.feature.identity.entity.User;

import java.math.BigDecimal;

/**
 * Lightweight seller info embedded in ProductDetailRes.
 * Only exposes public info about the seller — no sensitive data.
 */
public record SellerSummaryRes(
        String id,
        String storeName,
        BigDecimal reputationScore
) {
    public static SellerSummaryRes fromEntities(User seller, SellerProfile profile) {
        if (profile == null) {
            return new SellerSummaryRes(
                    seller.getId(),
                    seller.getFullName(),
                    null
            );
        }
        return new SellerSummaryRes(
                seller.getId(),
                profile.getStoreName(),
                profile.getReputationScore()
        );
    }
}
