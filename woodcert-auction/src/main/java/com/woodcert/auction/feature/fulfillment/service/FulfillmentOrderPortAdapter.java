package com.woodcert.auction.feature.fulfillment.service;

import com.woodcert.auction.feature.fulfillment.entity.FulfillmentStatus;
import com.woodcert.auction.feature.fulfillment.entity.OrderFulfillment;
import com.woodcert.auction.feature.fulfillment.repository.FulfillmentRepository;
import com.woodcert.auction.feature.order.entity.OrderEntity;
import com.woodcert.auction.feature.order.service.fulfillment.OrderFulfillmentPort;
import com.woodcert.auction.feature.order.service.fulfillment.OrderFulfillmentSnapshot;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class FulfillmentOrderPortAdapter implements OrderFulfillmentPort {

    private final FulfillmentRepository fulfillmentRepository;

    @Override
    @Transactional
    public void ensurePendingShipment(OrderEntity order) {
        if (fulfillmentRepository.findByOrderId(order.getId()).isPresent()) {
            return;
        }
        OrderFulfillment fulfillment = new OrderFulfillment();
        fulfillment.setOrderId(order.getId());
        fulfillment.setBuyerId(order.getBuyerId());
        fulfillment.setSellerId(order.getSellerId());
        fulfillment.setStatus(FulfillmentStatus.PENDING_SHIPMENT);
        fulfillmentRepository.save(fulfillment);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<OrderFulfillmentSnapshot> findSnapshotByOrderId(Long orderId) {
        return fulfillmentRepository.findByOrderId(orderId).map(this::toSnapshot);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<Long, OrderFulfillmentSnapshot> findSnapshotsByOrderIds(Collection<Long> orderIds) {
        if (orderIds == null || orderIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, OrderFulfillmentSnapshot> snapshots = new LinkedHashMap<>();
        for (OrderFulfillment fulfillment : fulfillmentRepository.findByOrderIdIn(orderIds)) {
            snapshots.put(fulfillment.getOrderId(), toSnapshot(fulfillment));
        }
        return snapshots;
    }

    private OrderFulfillmentSnapshot toSnapshot(OrderFulfillment fulfillment) {
        return new OrderFulfillmentSnapshot(
                fulfillment.getId(),
                fulfillment.getOrderId(),
                fulfillment.getStatus().name(),
                fulfillment.getDeliveryMethod() != null ? fulfillment.getDeliveryMethod().name() : null,
                fulfillment.getCarrierName(),
                fulfillment.getTrackingCode(),
                fulfillment.getShippedAt(),
                fulfillment.getReceivedAt(),
                fulfillment.getAutoCompleteDeadline()
        );
    }
}
