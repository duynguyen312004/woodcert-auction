package com.woodcert.auction.feature.order.service;

import com.woodcert.auction.feature.identity.service.BuyerOrderProfileQueryService;
import com.woodcert.auction.feature.identity.service.BuyerOrderProfileSnapshot;
import com.woodcert.auction.feature.order.dto.response.OrderListRes;
import com.woodcert.auction.feature.order.dto.response.OrderRes;
import com.woodcert.auction.feature.order.dto.response.OrderSummaryRes;
import com.woodcert.auction.feature.order.entity.OrderEntity;
import com.woodcert.auction.feature.order.service.fulfillment.OrderFulfillmentPort;
import com.woodcert.auction.feature.order.service.fulfillment.OrderFulfillmentSnapshot;
import org.springframework.stereotype.Component;

@Component
public class OrderResponseAssembler {

    private final OrderFulfillmentPort fulfillmentPort;
    private final BuyerOrderProfileQueryService buyerOrderProfileQueryService;

    public OrderResponseAssembler(
            OrderFulfillmentPort fulfillmentPort,
            BuyerOrderProfileQueryService buyerOrderProfileQueryService) {
        this.fulfillmentPort = fulfillmentPort;
        this.buyerOrderProfileQueryService = buyerOrderProfileQueryService;
    }

    public OrderRes toRes(OrderEntity order) {
        return OrderRes.fromEntity(order, fulfillmentSnapshot(order.getId()), buyerSnapshot(order.getBuyerId()));
    }

    public OrderListRes toListRes(OrderEntity order) {
        return OrderListRes.fromEntity(order, fulfillmentSnapshot(order.getId()));
    }

    public OrderSummaryRes toSummaryRes(OrderEntity order) {
        return OrderSummaryRes.fromEntity(order, fulfillmentSnapshot(order.getId()));
    }

    private OrderFulfillmentSnapshot fulfillmentSnapshot(Long orderId) {
        return fulfillmentPort.findSnapshotByOrderId(orderId).orElse(null);
    }

    private BuyerOrderProfileSnapshot buyerSnapshot(String buyerId) {
        var buyer = buyerOrderProfileQueryService.findBuyerProfile(buyerId);
        return buyer != null ? buyer.orElse(null) : null;
    }
}
