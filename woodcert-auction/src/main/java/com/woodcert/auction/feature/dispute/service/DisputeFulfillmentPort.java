package com.woodcert.auction.feature.dispute.service;

public interface DisputeFulfillmentPort {

    void markDisputeSellerWins(Long orderId);

    void markDisputeBuyerWins(Long orderId);
}
