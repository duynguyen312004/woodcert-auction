package com.woodcert.auction.feature.order.dto.response;

import com.woodcert.auction.feature.order.service.fulfillment.OrderFulfillmentSnapshot;

import java.time.Instant;

public record OrderFulfillmentSummaryRes(
        Long id,
        String status,
        String trackingCode,
        Instant shippedAt,
        Instant receivedAt,
        Instant autoCompleteDeadline
) {
    public static OrderFulfillmentSummaryRes fromSnapshot(OrderFulfillmentSnapshot snapshot) {
        if (snapshot == null) {
            return null;
        }
        return new OrderFulfillmentSummaryRes(
                snapshot.id(),
                snapshot.status(),
                snapshot.trackingCode(),
                snapshot.shippedAt(),
                snapshot.receivedAt(),
                snapshot.autoCompleteDeadline()
        );
    }
}
