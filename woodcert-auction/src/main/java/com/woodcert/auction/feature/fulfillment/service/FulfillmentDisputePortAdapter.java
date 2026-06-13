package com.woodcert.auction.feature.fulfillment.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.dispute.service.DisputeFulfillmentPort;
import com.woodcert.auction.feature.fulfillment.entity.FulfillmentStatus;
import com.woodcert.auction.feature.fulfillment.entity.OrderFulfillment;
import com.woodcert.auction.feature.fulfillment.repository.FulfillmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Component
@RequiredArgsConstructor
public class FulfillmentDisputePortAdapter implements DisputeFulfillmentPort {

    private final FulfillmentRepository fulfillmentRepository;

    @Override
    @Transactional
    public void markDisputeSellerWins(Long orderId) {
        OrderFulfillment fulfillment = fulfillmentForUpdate(orderId);
        fulfillment.setStatus(FulfillmentStatus.AUTO_COMPLETED);
        fulfillment.setReceivedAt(Instant.now());
        fulfillmentRepository.save(fulfillment);
    }

    @Override
    @Transactional
    public void markDisputeBuyerWins(Long orderId) {
        OrderFulfillment fulfillment = fulfillmentForUpdate(orderId);
        fulfillment.setStatus(FulfillmentStatus.CANCELED);
        fulfillmentRepository.save(fulfillment);
    }

    private OrderFulfillment fulfillmentForUpdate(Long orderId) {
        return fulfillmentRepository.findByOrderIdForUpdate(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
    }
}
