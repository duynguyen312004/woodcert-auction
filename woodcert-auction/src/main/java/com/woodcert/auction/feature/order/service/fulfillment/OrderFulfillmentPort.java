package com.woodcert.auction.feature.order.service.fulfillment;

import com.woodcert.auction.feature.order.entity.OrderEntity;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;

public interface OrderFulfillmentPort {

    void ensurePendingShipment(OrderEntity order);

    Optional<OrderFulfillmentSnapshot> findSnapshotByOrderId(Long orderId);

    Map<Long, OrderFulfillmentSnapshot> findSnapshotsByOrderIds(Collection<Long> orderIds);
}
