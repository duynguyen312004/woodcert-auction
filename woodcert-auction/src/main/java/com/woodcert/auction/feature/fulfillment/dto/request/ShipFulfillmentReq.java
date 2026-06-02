package com.woodcert.auction.feature.fulfillment.dto.request;

import jakarta.validation.constraints.Size;

public record ShipFulfillmentReq(
        @Size(max = 120)
        String trackingCode
) {
}
