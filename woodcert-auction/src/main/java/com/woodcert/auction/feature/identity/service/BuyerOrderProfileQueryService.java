package com.woodcert.auction.feature.identity.service;

import java.util.Optional;

public interface BuyerOrderProfileQueryService {

    Optional<BuyerOrderProfileSnapshot> findBuyerProfile(String buyerId);
}
