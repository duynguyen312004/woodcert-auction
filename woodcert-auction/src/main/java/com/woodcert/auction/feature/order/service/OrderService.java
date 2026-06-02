package com.woodcert.auction.feature.order.service;

import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.feature.order.dto.response.OrderListRes;
import com.woodcert.auction.feature.order.dto.response.OrderRes;
import com.woodcert.auction.feature.order.dto.response.OrderSummaryRes;
import com.woodcert.auction.feature.order.entity.OrderSourceType;

public interface OrderService {

    void createFromSource(OrderSourceType sourceType, Long sourceId);

    OrderRes payRemainder(String buyerId, Long orderId);

    OrderRes getOrderDetail(String userId, Long orderId);

    PaginationResponse<OrderListRes> getBuyerOrders(String buyerId, int page, int size);

    PaginationResponse<OrderListRes> getSellerOrders(String sellerId, int page, int size);

    OrderSummaryRes findSummaryBySource(OrderSourceType sourceType, Long sourceId);

    boolean cancelOverduePayment(Long orderId);

    void markFulfilling(String sellerId, Long orderId);

    void completeFromFulfillment(Long orderId);

    OrderRes openDispute(String buyerId, Long orderId);

    OrderRes cancelDispute(Long orderId);

    OrderRes resolveDisputeSellerWins(Long orderId);

    OrderRes resolveDisputeBuyerWins(Long orderId);
}
