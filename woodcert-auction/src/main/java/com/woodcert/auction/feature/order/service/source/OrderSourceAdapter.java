package com.woodcert.auction.feature.order.service.source;

import com.woodcert.auction.feature.order.entity.OrderEntity;
import com.woodcert.auction.feature.order.entity.OrderSourceType;

import java.util.Optional;

public interface OrderSourceAdapter {

    OrderSourceType sourceType();

    Optional<OrderSourceSnapshot> snapshotForOrderCreation(Long sourceId);

    void onOrderCreated(OrderEntity order);

    void onPaymentCanceled(OrderEntity order);

    void onOrderCompleted(OrderEntity order);
}
