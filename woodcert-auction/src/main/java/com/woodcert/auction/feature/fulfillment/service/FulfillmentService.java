package com.woodcert.auction.feature.fulfillment.service;

import com.woodcert.auction.feature.fulfillment.entity.DeliveryMethod;
import com.woodcert.auction.feature.order.dto.response.OrderRes;

public interface FulfillmentService {

    OrderRes confirmShipping(
            String sellerId,
            Long orderId,
            DeliveryMethod deliveryMethod,
            String carrierName,
            String trackingCode);

    OrderRes confirmReceived(String buyerId, Long orderId);

    boolean cancelOverdueShipment(Long fulfillmentId);

    boolean autoCompleteOverdueFulfillment(Long fulfillmentId);
}
