package com.woodcert.auction.feature.order.service.fulfillment;

import java.time.Instant;

public record OrderFulfillmentSnapshot(
        Long id,
        Long orderId,
        String status,
        String trackingCode,
        Instant shippedAt,
        Instant receivedAt,
        Instant autoCompleteDeadline
) {
}
