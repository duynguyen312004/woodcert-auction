package com.woodcert.auction.feature.fulfillment.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.fulfillment.config.FulfillmentProperties;
import com.woodcert.auction.feature.fulfillment.entity.DeliveryMethod;
import com.woodcert.auction.feature.fulfillment.entity.FulfillmentStatus;
import com.woodcert.auction.feature.fulfillment.entity.OrderFulfillment;
import com.woodcert.auction.feature.fulfillment.repository.FulfillmentRepository;
import com.woodcert.auction.feature.order.dto.response.OrderRes;
import com.woodcert.auction.feature.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class FulfillmentServiceImpl implements FulfillmentService {

    private final FulfillmentRepository fulfillmentRepository;
    private final FulfillmentProperties fulfillmentProperties;
    private final OrderService orderService;

    @Override
    @Transactional
    public OrderRes confirmShipping(
            String sellerId,
            Long orderId,
            DeliveryMethod deliveryMethod,
            String carrierName,
            String trackingCode) {
        OrderFulfillment fulfillment = fulfillmentRepository.findByOrderIdForUpdate(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        if (!sellerId.equals(fulfillment.getSellerId())) {
            throw new AppException(ErrorCode.ORDER_NOT_OWNED);
        }
        if (fulfillment.getStatus() != FulfillmentStatus.PENDING_SHIPMENT) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS);
        }

        String normalizedCarrierName = trimToNull(carrierName);
        String normalizedTrackingCode = trimToNull(trackingCode);
        validateShippingRequest(deliveryMethod, normalizedCarrierName, normalizedTrackingCode);

        orderService.markFulfilling(sellerId, orderId);
        Instant now = Instant.now();
        fulfillment.setStatus(FulfillmentStatus.SHIPPED);
        fulfillment.setDeliveryMethod(deliveryMethod);
        fulfillment.setCarrierName(deliveryMethod == DeliveryMethod.THIRD_PARTY ? normalizedCarrierName : null);
        fulfillment.setTrackingCode(normalizedTrackingCode);
        fulfillment.setShippedAt(now);
        fulfillment.setAutoCompleteDeadline(now.plus(fulfillmentProperties.getAutoCompleteAfter()));
        fulfillmentRepository.save(fulfillment);
        return orderService.getOrderDetail(sellerId, orderId);
    }

    @Override
    @Transactional
    public OrderRes confirmReceived(String buyerId, Long orderId) {
        OrderFulfillment fulfillment = fulfillmentRepository.findByOrderIdForUpdate(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        if (!buyerId.equals(fulfillment.getBuyerId())) {
            throw new AppException(ErrorCode.ORDER_NOT_OWNED);
        }
        if (fulfillment.getStatus() != FulfillmentStatus.SHIPPED) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS);
        }

        orderService.completeFromFulfillment(orderId);
        fulfillment.setStatus(FulfillmentStatus.DELIVERED);
        fulfillment.setReceivedAt(Instant.now());
        fulfillmentRepository.save(fulfillment);
        return orderService.getOrderDetail(buyerId, orderId);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean autoCompleteOverdueFulfillment(Long fulfillmentId) {
        OrderFulfillment fulfillment = fulfillmentRepository.findByIdForUpdate(fulfillmentId).orElse(null);
        if (fulfillment == null || fulfillment.getStatus() != FulfillmentStatus.SHIPPED) {
            return false;
        }
        Instant now = Instant.now();
        if (fulfillment.getAutoCompleteDeadline() == null || fulfillment.getAutoCompleteDeadline().isAfter(now)) {
            return false;
        }
        orderService.completeFromFulfillment(fulfillment.getOrderId());
        fulfillment.setStatus(FulfillmentStatus.AUTO_COMPLETED);
        fulfillment.setReceivedAt(now);
        fulfillmentRepository.save(fulfillment);
        return true;
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private void validateShippingRequest(
            DeliveryMethod deliveryMethod,
            String carrierName,
            String trackingCode) {
        if (deliveryMethod == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Delivery method is required");
        }
        if (deliveryMethod == DeliveryMethod.THIRD_PARTY
                && (carrierName == null || trackingCode == null)) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    "Carrier name and tracking code are required for third-party delivery");
        }
    }
}
