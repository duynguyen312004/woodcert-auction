package com.woodcert.auction.feature.order.service;

import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.finance.config.FinanceProperties;
import com.woodcert.auction.feature.finance.entity.PlatformRevenueType;
import com.woodcert.auction.feature.finance.entity.WalletReferenceType;
import com.woodcert.auction.feature.finance.service.PlatformRevenueService;
import com.woodcert.auction.feature.finance.service.WalletService;
import com.woodcert.auction.feature.finance.support.FinanceOperationKeys;
import com.woodcert.auction.feature.identity.service.ShippingAddressQueryService;
import com.woodcert.auction.feature.identity.service.ShippingAddressSnapshot;
import com.woodcert.auction.feature.order.config.OrderProperties;
import com.woodcert.auction.feature.order.dto.response.OrderListRes;
import com.woodcert.auction.feature.order.dto.response.OrderRes;
import com.woodcert.auction.feature.order.dto.response.OrderStatusCountsRes;
import com.woodcert.auction.feature.order.dto.response.OrderSummaryRes;
import com.woodcert.auction.feature.order.dto.response.SellerSalesSummaryRes;
import com.woodcert.auction.feature.order.entity.OrderEntity;
import com.woodcert.auction.feature.order.entity.OrderSourceType;
import com.woodcert.auction.feature.order.entity.OrderStatus;
import com.woodcert.auction.feature.order.repository.OrderRepository;
import com.woodcert.auction.feature.order.service.fulfillment.OrderFulfillmentPort;
import com.woodcert.auction.feature.order.service.fulfillment.OrderFulfillmentSnapshot;
import com.woodcert.auction.feature.order.service.source.OrderSourceAdapter;
import com.woodcert.auction.feature.order.service.source.OrderSourceSnapshot;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final WalletService walletService;
    private final PlatformRevenueService platformRevenueService;
    private final OrderProperties orderProperties;
    private final FinanceProperties financeProperties;
    private final OrderFeeCalculator feeCalculator;
    private final OrderFulfillmentPort fulfillmentPort;
    private final ShippingAddressQueryService shippingAddressQueryService;
    private final OrderRefundCalculator refundCalculator;
    private final OrderResponseAssembler responseAssembler;
    private final SellerSalesSummaryService sellerSalesSummaryService;
    private final Map<OrderSourceType, OrderSourceAdapter> sourceAdaptersByType;

    public OrderServiceImpl(
            OrderRepository orderRepository,
            WalletService walletService,
            PlatformRevenueService platformRevenueService,
            OrderProperties orderProperties,
            FinanceProperties financeProperties,
            OrderFeeCalculator feeCalculator,
            OrderFulfillmentPort fulfillmentPort,
            ShippingAddressQueryService shippingAddressQueryService,
            OrderRefundCalculator refundCalculator,
            OrderResponseAssembler responseAssembler,
            SellerSalesSummaryService sellerSalesSummaryService,
            List<OrderSourceAdapter> sourceAdapters) {
        this.orderRepository = orderRepository;
        this.walletService = walletService;
        this.platformRevenueService = platformRevenueService;
        this.orderProperties = orderProperties;
        this.financeProperties = financeProperties;
        this.feeCalculator = feeCalculator;
        this.fulfillmentPort = fulfillmentPort;
        this.shippingAddressQueryService = shippingAddressQueryService;
        this.refundCalculator = refundCalculator;
        this.responseAssembler = responseAssembler;
        this.sellerSalesSummaryService = sellerSalesSummaryService;
        this.sourceAdaptersByType = indexSourceAdapters(sourceAdapters);
    }

    @Override
    @Transactional
    public void createFromSource(OrderSourceType sourceType, Long sourceId) {
        if (orderRepository.findBySourceTypeAndSourceId(sourceType, sourceId).isPresent()) {
            return;
        }

        OrderSourceAdapter adapter = adapterFor(sourceType);
        OrderSourceSnapshot snapshot = adapter.snapshotForOrderCreation(sourceId).orElse(null);
        if (snapshot == null) {
            return;
        }

        Instant now = Instant.now();
        BigDecimal finalPrice = feeCalculator.money(snapshot.finalPrice());
        BigDecimal depositAmount = feeCalculator.money(snapshot.depositAmount());
        BigDecimal remainingAmount = feeCalculator.money(finalPrice.subtract(depositAmount).max(BigDecimal.ZERO));

        OrderEntity order = new OrderEntity();
        order.setSourceType(snapshot.sourceType());
        order.setSourceId(snapshot.sourceId());
        order.setBuyerId(snapshot.buyerId());
        order.setSellerId(snapshot.sellerId());
        order.setProductId(snapshot.productId());
        order.setProductTitle(snapshot.productTitle());
        order.setProductImageUrl(snapshot.productImageUrl());
        order.setFinalPrice(finalPrice);
        order.setDepositAmount(depositAmount);
        order.setRemainingAmount(remainingAmount);
        order.setStatus(OrderStatus.PENDING_PAYMENT);
        order.setPaymentDeadline(now.plus(orderProperties.getPaymentDeadline()));

        OrderEntity saved = orderRepository.save(order);
        adapter.onOrderCreated(saved);
    }

    @Override
    @Transactional
    public OrderRes payRemainder(String buyerId, Long orderId, Long addressId) {
        OrderEntity order = getOwnedOrderForUpdate(orderId, buyerId);
        if (!buyerId.equals(order.getBuyerId())) {
            throw new AppException(ErrorCode.ORDER_NOT_OWNED);
        }
        if (order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS);
        }
        if (order.getPaymentDeadline() != null && !order.getPaymentDeadline().isAfter(Instant.now())) {
            throw new AppException(ErrorCode.ORDER_PAYMENT_DEADLINE_EXCEEDED);
        }

        ShippingAddressSnapshot shippingAddress = shippingAddressQueryService.getOwnedAddressSnapshot(buyerId,
                addressId);
        applyShippingAddress(order, shippingAddress);

        if (order.getRemainingAmount().compareTo(BigDecimal.ZERO) > 0) {
            walletService.payOrder(
                    buyerId,
                    FinanceOperationKeys.orderPayment(order.getId(), buyerId),
                    order.getRemainingAmount(),
                    order.getId());
        }
        order.setStatus(OrderStatus.PAID);
        order.setPaidAt(Instant.now());
        OrderEntity saved = orderRepository.save(order);
        fulfillmentPort.ensurePendingShipment(saved);
        return responseAssembler.toRes(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderRes getOrderDetail(String userId, Long orderId) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        if (!userId.equals(order.getBuyerId()) && !userId.equals(order.getSellerId())) {
            throw new AppException(ErrorCode.ORDER_NOT_OWNED);
        }
        return responseAssembler.toRes(order);
    }

    @Override
    @Transactional(readOnly = true)
    public PaginationResponse<OrderListRes> getBuyerOrders(String buyerId, OrderStatus status, int page, int size) {
        var pageable = PageRequest.of(Math.max(0, page - 1), Math.min(Math.max(size, 1), 50));
        var orders = status == null
                ? orderRepository.findByBuyerIdOrderByCreatedAtDescIdDesc(buyerId, pageable)
                : orderRepository.findByBuyerIdAndStatusOrderByCreatedAtDescIdDesc(buyerId, status, pageable);
        return PaginationResponse.of(orders.map(responseAssembler::toListRes));
    }

    @Override
    @Transactional(readOnly = true)
    public PaginationResponse<OrderListRes> getSellerOrders(String sellerId, OrderStatus status, int page, int size) {
        var pageable = PageRequest.of(Math.max(0, page - 1), Math.min(Math.max(size, 1), 50));
        var orders = status == null
                ? orderRepository.findBySellerIdOrderByCreatedAtDescIdDesc(sellerId, pageable)
                : orderRepository.findBySellerIdAndStatusOrderByCreatedAtDescIdDesc(sellerId, status, pageable);
        return PaginationResponse.of(orders.map(responseAssembler::toListRes));
    }

    @Override
    @Transactional(readOnly = true)
    public OrderStatusCountsRes getBuyerOrderStatusCounts(String buyerId) {
        return statusCounts(orderRepository.countByBuyerIdGroupedByStatus(buyerId));
    }

    @Override
    @Transactional(readOnly = true)
    public OrderStatusCountsRes getSellerOrderStatusCounts(String sellerId) {
        return statusCounts(orderRepository.countBySellerIdGroupedByStatus(sellerId));
    }

    @Override
    @Transactional(readOnly = true)
    public SellerSalesSummaryRes getSellerSalesSummary(String sellerId, String rangeValue) {
        return sellerSalesSummaryService.getSellerSalesSummary(sellerId, rangeValue);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderSummaryRes findSummaryBySource(OrderSourceType sourceType, Long sourceId) {
        return orderRepository.findBySourceTypeAndSourceId(sourceType, sourceId)
                .map(responseAssembler::toSummaryRes)
                .orElse(null);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean cancelOverduePayment(Long orderId) {
        OrderEntity order = orderRepository.findByIdForUpdate(orderId).orElse(null);
        if (order == null || order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            return false;
        }
        Instant now = Instant.now();
        if (order.getPaymentDeadline() == null || order.getPaymentDeadline().isAfter(now)) {
            return false;
        }

        BigDecimal platformFee = feeCalculator.money(
                order.getDepositAmount().multiply(financeProperties.getForfeitedDepositPlatformRate()));
        BigDecimal sellerAmount = feeCalculator.money(order.getDepositAmount().subtract(platformFee));

        if (sellerAmount.compareTo(BigDecimal.ZERO) > 0) {
            walletService.creditSellerForfeitCompensation(
                    order.getSellerId(),
                    FinanceOperationKeys.orderForfeitSeller(order.getId()),
                    sellerAmount,
                    order.getId());
        }
        if (platformFee.compareTo(BigDecimal.ZERO) > 0) {
            platformRevenueService.recordRevenue(
                    PlatformRevenueType.FORFEITED_DEPOSIT_FEE,
                    platformFee,
                    order.getBuyerId(),
                    WalletReferenceType.ORDER,
                    order.getId(),
                    FinanceOperationKeys.orderForfeitPlatform(order.getId()));
        }

        order.setStatus(OrderStatus.CANCELED);
        order.setCanceledAt(now);
        order.setCancelReason("PAYMENT_DEADLINE_EXCEEDED");
        order.setForfeitedDepositPlatformFeeAmount(platformFee);
        order.setForfeitedDepositSellerAmount(sellerAmount);
        OrderEntity saved = orderRepository.save(order);
        adapterFor(saved.getSourceType()).onPaymentCanceled(saved);
        return true;
    }

    @Override
    @Transactional
    public void markFulfilling(String sellerId, Long orderId) {
        OrderEntity order = getOwnedOrderForUpdate(orderId, sellerId);
        if (!sellerId.equals(order.getSellerId())) {
            throw new AppException(ErrorCode.ORDER_NOT_OWNED);
        }
        if (order.getStatus() != OrderStatus.PAID) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS);
        }
        order.setStatus(OrderStatus.FULFILLING);
        orderRepository.save(order);
    }

    @Override
    @Transactional
    public void completeFromFulfillment(Long orderId) {
        OrderEntity order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        if (order.getStatus() != OrderStatus.FULFILLING) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS);
        }

        completeOrder(order);
    }

    @Override
    @Transactional
    public OrderRes openDispute(String buyerId, Long orderId) {
        OrderEntity order = getOwnedOrderForUpdate(orderId, buyerId);
        if (!buyerId.equals(order.getBuyerId())) {
            throw new AppException(ErrorCode.ORDER_NOT_OWNED);
        }
        if (order.getStatus() != OrderStatus.FULFILLING) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS);
        }

        OrderFulfillmentSnapshot fulfillment = fulfillmentPort.findSnapshotByOrderId(order.getId()).orElse(null);
        if (fulfillment == null || !"SHIPPED".equals(fulfillment.status())) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS);
        }

        order.setStatus(OrderStatus.DISPUTED);
        return responseAssembler.toRes(orderRepository.save(order));
    }

    @Override
    @Transactional
    public OrderRes cancelDispute(Long orderId) {
        OrderEntity order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        if (order.getStatus() != OrderStatus.DISPUTED) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS);
        }

        order.setStatus(OrderStatus.FULFILLING);
        return responseAssembler.toRes(orderRepository.save(order));
    }

    @Override
    @Transactional
    public OrderRes resolveDisputeSellerWins(Long orderId) {
        OrderEntity order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        if (order.getStatus() != OrderStatus.DISPUTED) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS);
        }
        return responseAssembler.toRes(completeOrder(order));
    }

    @Override
    @Transactional
    public OrderRes resolveDisputeBuyerWins(Long orderId) {
        OrderEntity order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        if (order.getStatus() != OrderStatus.DISPUTED) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS);
        }

        BigDecimal refundAmount = refundCalculator.disputeBuyerRefundAmount(order);
        walletService.refundOrder(
                order.getBuyerId(),
                FinanceOperationKeys.orderDisputeRefund(order.getId()),
                refundAmount,
                order.getId());

        Instant now = Instant.now();
        order.setStatus(OrderStatus.CANCELED);
        order.setCanceledAt(now);
        order.setCancelReason("DISPUTE_BUYER_WINS");
        order.setBuyerRefundAmount(refundAmount);
        order.setRefundedAt(now);
        OrderEntity saved = orderRepository.save(order);
        adapterFor(saved.getSourceType()).onDisputeBuyerWon(saved);
        return responseAssembler.toRes(saved);
    }

    private OrderEntity completeOrder(OrderEntity order) {
        BigDecimal rate = feeCalculator.commissionRate(order.getFinalPrice());
        BigDecimal commission = feeCalculator.commissionAmount(order.getFinalPrice(), rate);
        BigDecimal payout = feeCalculator.money(order.getFinalPrice().subtract(commission));

        if (payout.compareTo(BigDecimal.ZERO) > 0) {
            walletService.creditSellerPayout(
                    order.getSellerId(),
                    FinanceOperationKeys.orderCompletionPayout(order.getId()),
                    payout,
                    order.getId());
        }
        if (commission.compareTo(BigDecimal.ZERO) > 0) {
            platformRevenueService.recordRevenue(
                    PlatformRevenueType.SALE_COMMISSION,
                    commission,
                    order.getSellerId(),
                    WalletReferenceType.ORDER,
                    order.getId(),
                    FinanceOperationKeys.orderCompletionCommission(order.getId()));
        }

        order.setPlatformCommissionRate(rate);
        order.setPlatformCommissionAmount(commission);
        order.setSellerPayoutAmount(payout);
        order.setStatus(OrderStatus.COMPLETED);
        order.setCompletedAt(Instant.now());
        OrderEntity saved = orderRepository.save(order);
        adapterFor(saved.getSourceType()).onOrderCompleted(saved);
        return saved;
    }

    private OrderEntity getOwnedOrderForUpdate(Long orderId, String userId) {
        OrderEntity order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        if (!userId.equals(order.getBuyerId()) && !userId.equals(order.getSellerId())) {
            throw new AppException(ErrorCode.ORDER_NOT_OWNED);
        }
        return order;
    }

    private OrderSourceAdapter adapterFor(OrderSourceType sourceType) {
        return sourceAdaptersByType.get(sourceType);
    }

    private static Map<OrderSourceType, OrderSourceAdapter> indexSourceAdapters(
            List<OrderSourceAdapter> sourceAdapters) {
        Map<OrderSourceType, OrderSourceAdapter> adapters = new EnumMap<>(OrderSourceType.class);
        for (OrderSourceAdapter adapter : sourceAdapters) {
            adapters.put(adapter.sourceType(), adapter);
        }
        return adapters;
    }

    private void applyShippingAddress(OrderEntity order, ShippingAddressSnapshot address) {
        order.setShippingReceiverName(address.receiverName());
        order.setShippingPhoneNumber(address.phoneNumber());
        order.setShippingStreetAddress(address.streetAddress());
        order.setShippingWardCode(address.wardCode());
        order.setShippingWardName(address.wardName());
        order.setShippingDistrictCode(address.districtCode());
        order.setShippingDistrictName(address.districtName());
        order.setShippingProvinceCode(address.provinceCode());
        order.setShippingProvinceName(address.provinceName());
    }

    private OrderStatusCountsRes statusCounts(List<Object[]> rows) {
        Map<OrderStatus, Long> byStatus = new EnumMap<>(OrderStatus.class);
        for (OrderStatus status : OrderStatus.values()) {
            byStatus.put(status, 0L);
        }
        long total = 0L;
        for (Object[] row : rows) {
            OrderStatus status = (OrderStatus) row[0];
            long count = (Long) row[1];
            byStatus.put(status, count);
            total += count;
        }
        return new OrderStatusCountsRes(total, byStatus);
    }
}
