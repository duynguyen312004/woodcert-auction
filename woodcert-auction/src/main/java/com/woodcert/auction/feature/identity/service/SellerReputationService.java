package com.woodcert.auction.feature.identity.service;

import java.math.BigDecimal;

/**
 * Cập nhật điểm uy tín của seller sau các nghiệp vụ đánh giá ở module khác.
 */
public interface SellerReputationService {

    void updateReputationScore(String sellerId, BigDecimal reputationScore);
}
