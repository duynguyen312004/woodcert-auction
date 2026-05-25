package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.feature.identity.repository.SellerProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Identity sở hữu việc ghi điểm uy tín vào seller profile.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SellerReputationServiceImpl implements SellerReputationService {

    private final SellerProfileRepository sellerProfileRepository;

    @Override
    @Transactional
    public void updateReputationScore(String sellerId, BigDecimal reputationScore) {
        sellerProfileRepository.findById(sellerId).ifPresentOrElse(sellerProfile -> {
            sellerProfile.setReputationScore(reputationScore);
            sellerProfileRepository.save(sellerProfile);
        }, () -> log.warn("Seller profile {} not found when updating reputation score", sellerId));
    }
}
