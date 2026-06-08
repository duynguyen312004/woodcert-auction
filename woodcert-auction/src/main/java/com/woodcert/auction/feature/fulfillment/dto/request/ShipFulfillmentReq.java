package com.woodcert.auction.feature.fulfillment.dto.request;

import com.woodcert.auction.feature.fulfillment.entity.DeliveryMethod;
import jakarta.validation.constraints.Size;

public record ShipFulfillmentReq(
        DeliveryMethod deliveryMethod,
        @Size(max = 120)
        String carrierName,
        @Size(max = 120)
        String trackingCode
) {
}
