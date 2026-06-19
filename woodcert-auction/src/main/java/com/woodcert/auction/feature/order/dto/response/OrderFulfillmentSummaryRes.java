package com.woodcert.auction.feature.order.dto.response;

import com.woodcert.auction.feature.order.service.fulfillment.OrderFulfillmentSnapshot;

import java.time.Instant;

public record OrderFulfillmentSummaryRes(
        Long id,
        String status,
        Instant shipmentDeadline,
        String deliveryMethod,
        String carrierName,
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
                snapshot.shipmentDeadline(),
                snapshot.deliveryMethod(),
                snapshot.carrierName(),
                snapshot.trackingCode(),
                snapshot.shippedAt(),
                snapshot.receivedAt(),
                snapshot.autoCompleteDeadline()
        );
    }
}
