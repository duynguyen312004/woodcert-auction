package com.woodcert.auction.feature.fulfillment.service;

import com.woodcert.auction.feature.order.dto.response.OrderRes;

public interface FulfillmentService {

    OrderRes confirmShipping(String sellerId, Long orderId, String trackingCode);

    OrderRes confirmReceived(String buyerId, Long orderId);

    boolean autoCompleteOverdueFulfillment(Long fulfillmentId);
}
