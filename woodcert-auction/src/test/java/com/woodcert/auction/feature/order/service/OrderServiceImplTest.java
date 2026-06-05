package com.woodcert.auction.feature.order.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.finance.config.FinanceProperties;
import com.woodcert.auction.feature.finance.entity.PlatformRevenueType;
import com.woodcert.auction.feature.finance.entity.WalletReferenceType;
import com.woodcert.auction.feature.finance.service.PlatformRevenueService;
import com.woodcert.auction.feature.finance.service.WalletService;
import com.woodcert.auction.feature.order.config.OrderProperties;
import com.woodcert.auction.feature.order.entity.OrderEntity;
import com.woodcert.auction.feature.order.entity.OrderSourceType;
import com.woodcert.auction.feature.order.entity.OrderStatus;
import com.woodcert.auction.feature.order.repository.OrderRepository;
import com.woodcert.auction.feature.order.service.fulfillment.OrderFulfillmentPort;
import com.woodcert.auction.feature.order.service.fulfillment.OrderFulfillmentSnapshot;
import com.woodcert.auction.feature.order.service.source.OrderSourceAdapter;
import com.woodcert.auction.feature.order.service.source.OrderSourceSnapshot;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceImplTest {

    private static final Long ORDER_ID = 91L;
    private static final Long SOURCE_ID = 501L;
    private static final Long PRODUCT_ID = 801L;
    private static final String BUYER_ID = "buyer-1";
    private static final String SELLER_ID = "seller-1";

    @Mock private OrderRepository orderRepository;
    @Mock private WalletService walletService;
    @Mock private PlatformRevenueService platformRevenueService;
    @Mock private OrderFulfillmentPort fulfillmentPort;
    @Mock private OrderSourceAdapter sourceAdapter;

    private OrderServiceImpl orderService;

    @BeforeEach
    void setUp() {
        when(sourceAdapter.sourceType()).thenReturn(OrderSourceType.AUCTION);
        orderService = new OrderServiceImpl(
                orderRepository,
                walletService,
                platformRevenueService,
                new OrderProperties(),
                new FinanceProperties(),
                new OrderFeeCalculator(),
                fulfillmentPort,
                List.of(sourceAdapter)
        );
    }

    @Test
    void getBuyerOrders_withStatusUsesStatusFilterRepository() {
        OrderEntity order = baseOrder();
        order.setStatus(OrderStatus.PAID);
        when(orderRepository.findByBuyerIdAndStatusOrderByCreatedAtDescIdDesc(
                eq(BUYER_ID),
                eq(OrderStatus.PAID),
                any()
        )).thenReturn(new PageImpl<>(List.of(order), PageRequest.of(0, 10), 1));
        when(fulfillmentPort.findSnapshotByOrderId(ORDER_ID)).thenReturn(Optional.empty());

        var result = orderService.getBuyerOrders(BUYER_ID, OrderStatus.PAID, 1, 10);

        assertThat(result.result()).hasSize(1);
        assertThat(result.result().get(0).status()).isEqualTo(OrderStatus.PAID);
        verify(orderRepository, never()).findByBuyerIdOrderByCreatedAtDescIdDesc(any(), any());
    }

    @Test
    void getSellerOrderStatusCounts_returnsAllStatusesWithZeroDefaults() {
        when(orderRepository.countBySellerIdGroupedByStatus(SELLER_ID))
                .thenReturn(List.of(
                        new Object[]{OrderStatus.PAID, 2L},
                        new Object[]{OrderStatus.CANCELED, 1L}
                ));

        var result = orderService.getSellerOrderStatusCounts(SELLER_ID);

        assertThat(result.total()).isEqualTo(3L);
        assertThat(result.byStatus()).containsEntry(OrderStatus.PAID, 2L);
        assertThat(result.byStatus()).containsEntry(OrderStatus.CANCELED, 1L);
        assertThat(result.byStatus()).containsEntry(OrderStatus.PENDING_PAYMENT, 0L);
        assertThat(result.byStatus().keySet()).containsExactlyInAnyOrder(OrderStatus.values());
    }

    @Test
    void createFromSource_createsPendingPaymentOrderWhenDepositDoesNotCoverFinalPrice() {
        when(orderRepository.findBySourceTypeAndSourceId(OrderSourceType.AUCTION, SOURCE_ID))
                .thenReturn(Optional.empty());
        when(sourceAdapter.snapshotForOrderCreation(SOURCE_ID)).thenReturn(Optional.of(new OrderSourceSnapshot(
                OrderSourceType.AUCTION,
                SOURCE_ID,
                BUYER_ID,
                SELLER_ID,
                PRODUCT_ID,
                money("10000000"),
                money("1000000")
        )));
        saveReturnsEntityWithId();

        orderService.createFromSource(OrderSourceType.AUCTION, SOURCE_ID);

        ArgumentCaptor<OrderEntity> orderCaptor = ArgumentCaptor.forClass(OrderEntity.class);
        verify(orderRepository).save(orderCaptor.capture());
        OrderEntity saved = orderCaptor.getValue();
        assertThat(saved.getStatus()).isEqualTo(OrderStatus.PENDING_PAYMENT);
        assertThat(saved.getRemainingAmount()).isEqualByComparingTo("9000000.00");
        assertThat(saved.getPaymentDeadline()).isNotNull();
        verify(sourceAdapter).onOrderCreated(saved);
        verify(fulfillmentPort, never()).ensurePendingShipment(any(OrderEntity.class));
    }

    @Test
    void createFromSource_createsPaidOrderAndPendingShipmentWhenDepositCoversFinalPrice() {
        when(orderRepository.findBySourceTypeAndSourceId(OrderSourceType.AUCTION, SOURCE_ID))
                .thenReturn(Optional.empty());
        when(sourceAdapter.snapshotForOrderCreation(SOURCE_ID)).thenReturn(Optional.of(new OrderSourceSnapshot(
                OrderSourceType.AUCTION,
                SOURCE_ID,
                BUYER_ID,
                SELLER_ID,
                PRODUCT_ID,
                money("1000000"),
                money("1000000")
        )));
        saveReturnsEntityWithId();

        orderService.createFromSource(OrderSourceType.AUCTION, SOURCE_ID);

        ArgumentCaptor<OrderEntity> orderCaptor = ArgumentCaptor.forClass(OrderEntity.class);
        verify(orderRepository).save(orderCaptor.capture());
        OrderEntity saved = orderCaptor.getValue();
        assertThat(saved.getStatus()).isEqualTo(OrderStatus.PAID);
        assertThat(saved.getPaidAt()).isNotNull();
        verify(fulfillmentPort).ensurePendingShipment(saved);
    }

    @Test
    void payRemainder_withValidPendingOrderWithdrawsFundsAndCreatesFulfillment() {
        OrderEntity order = pendingPaymentOrder(Instant.now().plusSeconds(3600));
        when(orderRepository.findByIdForUpdate(ORDER_ID)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(OrderEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(fulfillmentPort.findSnapshotByOrderId(ORDER_ID)).thenReturn(Optional.empty());

        var result = orderService.payRemainder(BUYER_ID, ORDER_ID);

        verify(walletService).withdrawFunds(
                eq(BUYER_ID),
                eq("order:pay:" + ORDER_ID + ":" + BUYER_ID),
                eq(money("9000000")),
                eq(ORDER_ID),
                eq(WalletReferenceType.ORDER)
        );
        verify(fulfillmentPort).ensurePendingShipment(order);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.PAID);
        assertThat(order.getPaidAt()).isNotNull();
        assertThat(result.status()).isEqualTo(OrderStatus.PAID);
    }

    @Test
    void payRemainder_afterPaymentDeadlineThrowsBusinessError() {
        OrderEntity order = pendingPaymentOrder(Instant.now().minusSeconds(1));
        when(orderRepository.findByIdForUpdate(ORDER_ID)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.payRemainder(BUYER_ID, ORDER_ID))
                .isInstanceOf(AppException.class)
                .satisfies(throwable -> assertThat(((AppException) throwable).getErrorCode())
                        .isEqualTo(ErrorCode.ORDER_PAYMENT_DEADLINE_EXCEEDED));

        verify(walletService, never()).withdrawFunds(any(), any(), any(), any(), any());
        verify(orderRepository, never()).save(any(OrderEntity.class));
    }

    @Test
    void cancelOverduePayment_withFutureDeadlineDoesNotCancel() {
        OrderEntity order = pendingPaymentOrder(Instant.now().plusSeconds(3600));
        when(orderRepository.findByIdForUpdate(ORDER_ID)).thenReturn(Optional.of(order));

        boolean canceled = orderService.cancelOverduePayment(ORDER_ID);

        assertThat(canceled).isFalse();
        assertThat(order.getStatus()).isEqualTo(OrderStatus.PENDING_PAYMENT);
        verify(orderRepository, never()).save(any(OrderEntity.class));
        verify(walletService, never()).depositFunds(any(), any(), any(), any(), any());
        verify(platformRevenueService, never()).recordRevenue(any(), any(), any(), any(), any(), any());
        verify(sourceAdapter, never()).onPaymentCanceled(any(OrderEntity.class));
    }

    @Test
    void cancelOverduePayment_forOverdueOrderSplitsForfeitedDeposit() {
        OrderEntity order = pendingPaymentOrder(Instant.now().minusSeconds(1));
        when(orderRepository.findByIdForUpdate(ORDER_ID)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(OrderEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        boolean canceled = orderService.cancelOverduePayment(ORDER_ID);

        assertThat(canceled).isTrue();
        assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELED);
        assertThat(order.getCancelReason()).isEqualTo("PAYMENT_DEADLINE_EXCEEDED");
        assertThat(order.getForfeitedDepositPlatformFeeAmount()).isEqualByComparingTo("100000.00");
        assertThat(order.getForfeitedDepositSellerAmount()).isEqualByComparingTo("900000.00");
        verify(walletService).depositFunds(
                eq(SELLER_ID),
                eq("order:forfeit:seller:" + ORDER_ID),
                eq(money("900000")),
                eq(ORDER_ID),
                eq(WalletReferenceType.ORDER)
        );
        verify(platformRevenueService).recordRevenue(
                eq(PlatformRevenueType.FORFEITED_DEPOSIT_FEE),
                eq(money("100000")),
                eq(BUYER_ID),
                eq(WalletReferenceType.ORDER),
                eq(ORDER_ID),
                eq("order:forfeit:platform:" + ORDER_ID)
        );
        verify(sourceAdapter).onPaymentCanceled(order);
    }

    @Test
    void completeFromFulfillmentPaysSellerAndRecordsCommission() {
        OrderEntity order = baseOrder();
        order.setStatus(OrderStatus.FULFILLING);
        order.setFinalPrice(money("10000000"));
        when(orderRepository.findByIdForUpdate(ORDER_ID)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(OrderEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        orderService.completeFromFulfillment(ORDER_ID);

        assertThat(order.getStatus()).isEqualTo(OrderStatus.COMPLETED);
        assertThat(order.getPlatformCommissionRate()).isEqualByComparingTo("0.0500");
        assertThat(order.getPlatformCommissionAmount()).isEqualByComparingTo("500000.00");
        assertThat(order.getSellerPayoutAmount()).isEqualByComparingTo("9500000.00");
        verify(walletService).depositFunds(
                eq(SELLER_ID),
                eq("order:complete:payout:" + ORDER_ID),
                eq(money("9500000")),
                eq(ORDER_ID),
                eq(WalletReferenceType.ORDER)
        );
        verify(platformRevenueService).recordRevenue(
                eq(PlatformRevenueType.SALE_COMMISSION),
                eq(money("500000")),
                eq(SELLER_ID),
                eq(WalletReferenceType.ORDER),
                eq(ORDER_ID),
                eq("order:complete:commission:" + ORDER_ID)
        );
        verify(sourceAdapter).onOrderCompleted(order);
    }

    @Test
    void openDispute_withShippedFulfillmentLocksOrder() {
        OrderEntity order = baseOrder();
        order.setStatus(OrderStatus.FULFILLING);
        when(orderRepository.findByIdForUpdate(ORDER_ID)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(OrderEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(fulfillmentPort.findSnapshotByOrderId(ORDER_ID)).thenReturn(Optional.of(shippedFulfillment()));

        var result = orderService.openDispute(BUYER_ID, ORDER_ID);

        assertThat(order.getStatus()).isEqualTo(OrderStatus.DISPUTED);
        assertThat(result.status()).isEqualTo(OrderStatus.DISPUTED);
        verify(walletService, never()).depositFunds(any(), any(), any(), any(), any());
        verify(platformRevenueService, never()).recordRevenue(any(), any(), any(), any(), any(), any());
    }

    @Test
    void openDispute_requiresShippedFulfillment() {
        OrderEntity order = baseOrder();
        order.setStatus(OrderStatus.FULFILLING);
        when(orderRepository.findByIdForUpdate(ORDER_ID)).thenReturn(Optional.of(order));
        when(fulfillmentPort.findSnapshotByOrderId(ORDER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.openDispute(BUYER_ID, ORDER_ID))
                .isInstanceOf(AppException.class)
                .satisfies(throwable -> assertThat(((AppException) throwable).getErrorCode())
                        .isEqualTo(ErrorCode.ORDER_INVALID_STATUS));

        verify(orderRepository, never()).save(any(OrderEntity.class));
    }

    @Test
    void resolveDisputeSellerWinsCompletesOrderAndPaysSeller() {
        OrderEntity order = baseOrder();
        order.setStatus(OrderStatus.DISPUTED);
        order.setFinalPrice(money("10000000"));
        when(orderRepository.findByIdForUpdate(ORDER_ID)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(OrderEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = orderService.resolveDisputeSellerWins(ORDER_ID);

        assertThat(order.getStatus()).isEqualTo(OrderStatus.COMPLETED);
        assertThat(result.status()).isEqualTo(OrderStatus.COMPLETED);
        verify(walletService).depositFunds(
                eq(SELLER_ID),
                eq("order:complete:payout:" + ORDER_ID),
                eq(money("9500000")),
                eq(ORDER_ID),
                eq(WalletReferenceType.ORDER)
        );
        verify(platformRevenueService).recordRevenue(
                eq(PlatformRevenueType.SALE_COMMISSION),
                eq(money("500000")),
                eq(SELLER_ID),
                eq(WalletReferenceType.ORDER),
                eq(ORDER_ID),
                eq("order:complete:commission:" + ORDER_ID)
        );
        verify(sourceAdapter).onOrderCompleted(order);
    }

    @Test
    void resolveDisputeBuyerWinsRefundsBuyerAndMarksSourceReturned() {
        OrderEntity order = baseOrder();
        order.setStatus(OrderStatus.DISPUTED);
        order.setFinalPrice(money("10000000"));
        when(orderRepository.findByIdForUpdate(ORDER_ID)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(OrderEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = orderService.resolveDisputeBuyerWins(ORDER_ID);

        assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELED);
        assertThat(order.getCancelReason()).isEqualTo("DISPUTE_BUYER_WINS");
        assertThat(result.status()).isEqualTo(OrderStatus.CANCELED);
        verify(walletService).depositFunds(
                eq(BUYER_ID),
                eq("order:dispute:refund:" + ORDER_ID),
                eq(money("10000000")),
                eq(ORDER_ID),
                eq(WalletReferenceType.ORDER)
        );
        verify(sourceAdapter).onDisputeBuyerWon(order);
        verify(sourceAdapter, never()).onOrderCompleted(any(OrderEntity.class));
    }

    private void saveReturnsEntityWithId() {
        when(orderRepository.save(any(OrderEntity.class))).thenAnswer(invocation -> {
            OrderEntity order = invocation.getArgument(0);
            order.setId(ORDER_ID);
            return order;
        });
    }

    private OrderEntity pendingPaymentOrder(Instant deadline) {
        OrderEntity order = baseOrder();
        order.setStatus(OrderStatus.PENDING_PAYMENT);
        order.setPaymentDeadline(deadline);
        return order;
    }

    private OrderEntity baseOrder() {
        OrderEntity order = new OrderEntity();
        order.setId(ORDER_ID);
        order.setSourceType(OrderSourceType.AUCTION);
        order.setSourceId(SOURCE_ID);
        order.setProductId(PRODUCT_ID);
        order.setBuyerId(BUYER_ID);
        order.setSellerId(SELLER_ID);
        order.setFinalPrice(money("10000000"));
        order.setDepositAmount(money("1000000"));
        order.setRemainingAmount(money("9000000"));
        return order;
    }

    private OrderFulfillmentSnapshot shippedFulfillment() {
        return new OrderFulfillmentSnapshot(11L, ORDER_ID, "SHIPPED", "TRK-1", Instant.now(), null, Instant.now().plusSeconds(3600));
    }

    private BigDecimal money(String value) {
        return new BigDecimal(value).setScale(2);
    }
}
