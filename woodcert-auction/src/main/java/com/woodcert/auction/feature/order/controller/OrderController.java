package com.woodcert.auction.feature.order.controller;

import com.woodcert.auction.core.auth.CurrentUserId;
import com.woodcert.auction.core.dto.ApiResponse;
import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.feature.order.dto.response.OrderListRes;
import com.woodcert.auction.feature.order.dto.response.OrderRes;
import com.woodcert.auction.feature.order.dto.response.OrderStatusCountsRes;
import com.woodcert.auction.feature.order.dto.request.PayOrderReq;
import com.woodcert.auction.feature.order.dto.response.SellerSalesSummaryRes;
import com.woodcert.auction.feature.order.entity.OrderStatus;
import com.woodcert.auction.feature.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/{id}/pay")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<OrderRes>> payRemainder(
            @CurrentUserId String buyerId,
            @PathVariable Long id,
            @RequestBody @Valid PayOrderReq request) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.payRemainder(buyerId, id, request.addressId()),
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
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PaginationResponse<OrderListRes>>> getBuyerOrders(
            @CurrentUserId String buyerId,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.getBuyerOrders(buyerId, status, page, size),
                "Fetch buyer orders successful"));
    }

    @GetMapping("/my-purchases/status-counts")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<OrderStatusCountsRes>> getBuyerOrderStatusCounts(
            @CurrentUserId String buyerId) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.getBuyerOrderStatusCounts(buyerId),
                "Fetch buyer order status counts successful"));
    }

    @GetMapping("/my-sales")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PaginationResponse<OrderListRes>>> getSellerOrders(
            @CurrentUserId String sellerId,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.getSellerOrders(sellerId, status, page, size),
                "Fetch seller orders successful"));
    }

    @GetMapping("/my-sales/status-counts")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<OrderStatusCountsRes>> getSellerOrderStatusCounts(
            @CurrentUserId String sellerId) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.getSellerOrderStatusCounts(sellerId),
                "Fetch seller order status counts successful"));
    }

    @GetMapping("/my-sales/summary")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<SellerSalesSummaryRes>> getSellerSalesSummary(
            @CurrentUserId String sellerId,
            @RequestParam(defaultValue = "30D") String range) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.getSellerSalesSummary(sellerId, range),
                "Fetch seller sales summary successful"));
    }
}
