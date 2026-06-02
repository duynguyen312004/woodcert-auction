package com.woodcert.auction.feature.order.controller;

import com.woodcert.auction.core.auth.CurrentUserId;
import com.woodcert.auction.core.dto.ApiResponse;
import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.feature.order.dto.response.OrderListRes;
import com.woodcert.auction.feature.order.dto.response.OrderRes;
import com.woodcert.auction.feature.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/{id}/pay")
    @PreAuthorize("hasAuthority('JOIN_AUCTION')")
    public ResponseEntity<ApiResponse<OrderRes>> payRemainder(
            @CurrentUserId String buyerId,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.payRemainder(buyerId, id),
                "Order payment successful"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<OrderRes>> getOrderDetail(
            @CurrentUserId String userId,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.getOrderDetail(userId, id),
                "Fetch order successful"));
    }

    @GetMapping("/my-purchases")
    @PreAuthorize("hasAuthority('JOIN_AUCTION')")
    public ResponseEntity<ApiResponse<PaginationResponse<OrderListRes>>> getBuyerOrders(
            @CurrentUserId String buyerId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.getBuyerOrders(buyerId, page, size),
                "Fetch buyer orders successful"));
    }

    @GetMapping("/my-sales")
    @PreAuthorize("hasAuthority('CONFIRM_DELIVERY')")
    public ResponseEntity<ApiResponse<PaginationResponse<OrderListRes>>> getSellerOrders(
            @CurrentUserId String sellerId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.getSellerOrders(sellerId, page, size),
                "Fetch seller orders successful"));
    }
}
