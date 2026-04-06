package com.woodcert.auction.feature.identity.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.woodcert.auction.feature.identity.entity.SellerProfile;

import java.math.BigDecimal;

/**
 * Seller profile response.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record SellerProfileRes(
        String userId,
        String storeName,
        String identityCardNumber,
        String taxCode,
        BigDecimal reputationScore
) {
    public static SellerProfileRes fromEntity(SellerProfile sellerProfile) {
        return new SellerProfileRes(
                sellerProfile.getUserId(),
                sellerProfile.getStoreName(),
                sellerProfile.getIdentityCardNumber(),
                sellerProfile.getTaxCode(),
                sellerProfile.getReputationScore()
        );
    }
}
