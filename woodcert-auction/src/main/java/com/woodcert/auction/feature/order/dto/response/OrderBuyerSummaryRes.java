package com.woodcert.auction.feature.order.dto.response;

import com.woodcert.auction.feature.identity.service.BuyerOrderProfileSnapshot;

public record OrderBuyerSummaryRes(
        String id,
        String fullName,
        String phoneNumber,
        String email
) {
    public static OrderBuyerSummaryRes fromSnapshot(BuyerOrderProfileSnapshot snapshot) {
        if (snapshot == null) {
            return null;
        }
        return new OrderBuyerSummaryRes(
                snapshot.id(),
                snapshot.fullName(),
                snapshot.phoneNumber(),
                snapshot.email()
        );
    }
}
