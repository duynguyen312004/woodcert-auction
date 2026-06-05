package com.woodcert.auction.feature.fulfillment.controller;

import com.woodcert.auction.core.auth.CurrentUserId;
import com.woodcert.auction.core.dto.ApiResponse;
import com.woodcert.auction.feature.fulfillment.dto.request.ShipFulfillmentReq;
import com.woodcert.auction.feature.fulfillment.service.FulfillmentService;
import com.woodcert.auction.feature.order.dto.response.OrderRes;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/orders/{orderId}/fulfillment")
@RequiredArgsConstructor
public class FulfillmentController {

    private final FulfillmentService fulfillmentService;

    @PatchMapping("/ship")
    @PreAuthorize("hasAuthority('CONFIRM_DELIVERY')")
    public ResponseEntity<ApiResponse<OrderRes>> confirmShipping(
            @CurrentUserId String sellerId,
            @PathVariable Long orderId,
            @RequestBody(required = false) @Valid ShipFulfillmentReq request) {
        String trackingCode = request != null ? request.trackingCode() : null;
        return ResponseEntity.ok(ApiResponse.success(
                fulfillmentService.confirmShipping(sellerId, orderId, trackingCode),
                "Order shipping confirmed"));
    }

    @PatchMapping("/receive")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<OrderRes>> confirmReceived(
            @CurrentUserId String buyerId,
            @PathVariable Long orderId) {
        return ResponseEntity.ok(ApiResponse.success(
                fulfillmentService.confirmReceived(buyerId, orderId),
                "Order completed"));
    }
}
