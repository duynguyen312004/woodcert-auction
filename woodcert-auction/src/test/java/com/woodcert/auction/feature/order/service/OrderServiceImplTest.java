package com.woodcert.auction.feature.order.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.finance.config.FinanceProperties;
import com.woodcert.auction.feature.finance.entity.PlatformRevenueType;
import com.woodcert.auction.feature.finance.entity.WalletReferenceType;
import com.woodcert.auction.feature.finance.service.PlatformRevenueService;
import com.woodcert.auction.feature.finance.service.WalletService;
import com.woodcert.auction.feature.finance.support.FinanceOperationKeys;
import com.woodcert.auction.feature.identity.service.BuyerOrderProfileQueryService;
import com.woodcert.auction.feature.identity.service.BuyerOrderProfileSnapshot;
import com.woodcert.auction.feature.identity.service.ShippingAddressQueryService;
import com.woodcert.auction.feature.identity.service.ShippingAddressSnapshot;
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
import java.util.Map;
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

        @Mock
        private OrderRepository orderRepository;
        @Mock
        private WalletService walletService;
        @Mock
        private PlatformRevenueService platformRevenueService;
        @Mock
        private OrderFulfillmentPort fulfillmentPort;
        @Mock
        private ShippingAddressQueryService shippingAddressQueryService;
        @Mock
        private BuyerOrderProfileQueryService buyerOrderProfileQueryService;
        @Mock
        private OrderSourceAdapter sourceAdapter;

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
                                shippingAddressQueryService,
                                new OrderRefundCalculator(new OrderFeeCalculator()),
                                new OrderResponseAssembler(fulfillmentPort, buyerOrderProfileQueryService),
                                new SellerSalesSummaryService(orderRepository, new OrderFeeCalculator()),
                                List.of(sourceAdapter));
        }

        @Test
        void getBuyerOrders_withStatusLoadsFulfillmentSnapshotsInOneBulkCall() {
                OrderEntity order = baseOrder();
                order.setStatus(OrderStatus.PAID);
                OrderEntity secondOrder = baseOrder();
                secondOrder.setId(ORDER_ID + 1);
                secondOrder.setStatus(OrderStatus.PAID);
                when(orderRepository.findByBuyerIdAndStatusOrderByCreatedAtDescIdDesc(
                                eq(BUYER_ID),
                                eq(OrderStatus.PAID),
                                any())).thenReturn(new PageImpl<>(
                                        List.of(order, secondOrder),
                                        PageRequest.of(0, 10),
                                        2));
                when(fulfillmentPort.findSnapshotsByOrderIds(List.of(ORDER_ID, ORDER_ID + 1)))
                                .thenReturn(Map.of(ORDER_ID, shippedFulfillment()));

                var result = orderService.getBuyerOrders(BUYER_ID, OrderStatus.PAID, 1, 10);

                assertThat(result.result()).hasSize(2);
                assertThat(result.result().get(0).status()).isEqualTo(OrderStatus.PAID);
                assertThat(result.result().get(0).fulfillment().status()).isEqualTo("SHIPPED");
                assertThat(result.result().get(1).fulfillment()).isNull();
                verify(orderRepository, never()).findByBuyerIdOrderByCreatedAtDescIdDesc(any(), any());
                verify(fulfillmentPort).findSnapshotsByOrderIds(List.of(ORDER_ID, ORDER_ID + 1));
                verify(fulfillmentPort, never()).findSnapshotByOrderId(any());
        }

        @Test
        void payRemainder_rejectsSellerEvenThoughSellerParticipatesInOrder() {
                OrderEntity order = pendingPaymentOrder(Instant.now().plusSeconds(3600));
                when(orderRepository.findByIdForUpdate(ORDER_ID)).thenReturn(Optional.of(order));

                assertThatThrownBy(() -> orderService.payRemainder(SELLER_ID, ORDER_ID, 11L))
                                .isInstanceOf(AppException.class)
                                .satisfies(throwable -> assertThat(((AppException) throwable).getErrorCode())
                                                .isEqualTo(ErrorCode.ORDER_NOT_OWNED));

                verify(walletService, never()).payOrder(any(), any(), any(), any());
                verify(orderRepository, never()).save(any(OrderEntity.class));
        }

        @Test
        void getSellerOrderStatusCounts_returnsAllStatusesWithZeroDefaults() {
                when(orderRepository.countBySellerIdGroupedByStatus(SELLER_ID))
                                .thenReturn(List.of(
                                                new Object[] { OrderStatus.PAID, 2L },
                                                new Object[] { OrderStatus.CANCELED, 1L }));

                var result = orderService.getSellerOrderStatusCounts(SELLER_ID);

                assertThat(result.total()).isEqualTo(3L);
                assertThat(result.byStatus()).containsEntry(OrderStatus.PAID, 2L);
                assertThat(result.byStatus()).containsEntry(OrderStatus.CANCELED, 1L);
                assertThat(result.byStatus()).containsEntry(OrderStatus.PENDING_PAYMENT, 0L);
                assertThat(result.byStatus().keySet()).containsExactlyInAnyOrder(OrderStatus.values());
        }

        @Test
        void getOrderDetail_returnsBuyerSummaryForOwnedSellerOrder() {
                OrderEntity order = baseOrder();
                when(orderRepository.findById(ORDER_ID)).thenReturn(Optional.of(order));
                when(fulfillmentPort.findSnapshotByOrderId(ORDER_ID)).thenReturn(Optional.empty());
                when(buyerOrderProfileQueryService.findBuyerProfile(BUYER_ID))
                                .thenReturn(Optional.of(new BuyerOrderProfileSnapshot(
                                                BUYER_ID,
                                                "Nguyen Van A",
                                                "0911222333",
                                                "buyer@example.com")));

                var result = orderService.getOrderDetail(SELLER_ID, ORDER_ID);

                assertThat(result.buyer()).isNotNull();
                assertThat(result.buyer().id()).isEqualTo(BUYER_ID);
                assertThat(result.buyer().fullName()).isEqualTo("Nguyen Van A");
                assertThat(result.buyer().phoneNumber()).isEqualTo("0911222333");
                assertThat(result.buyer().email()).isEqualTo("buyer@example.com");
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
                                "Binh go quy",
                                "https://cdn.example/product.jpg",
                                money("10000000"),
                                money("1000000"))));
                saveReturnsEntityWithId();

                orderService.createFromSource(OrderSourceType.AUCTION, SOURCE_ID);

                ArgumentCaptor<OrderEntity> orderCaptor = ArgumentCaptor.forClass(OrderEntity.class);
                verify(orderRepository).save(orderCaptor.capture());
                OrderEntity saved = orderCaptor.getValue();
                assertThat(saved.getStatus()).isEqualTo(OrderStatus.PENDING_PAYMENT);
                assertThat(saved.getRemainingAmount()).isEqualByComparingTo("9000000.00");
                assertThat(saved.getProductTitle()).isEqualTo("Binh go quy");
                assertThat(saved.getProductImageUrl()).isEqualTo("https://cdn.example/product.jpg");
                assertThat(saved.getPaymentDeadline()).isNotNull();
                verify(sourceAdapter).onOrderCreated(saved);
                verify(fulfillmentPort, never()).ensurePendingShipment(any(OrderEntity.class));
        }

        @Test
        void createFromSource_requiresAddressConfirmationWhenDepositCoversFinalPrice() {
                when(orderRepository.findBySourceTypeAndSourceId(OrderSourceType.AUCTION, SOURCE_ID))
                                .thenReturn(Optional.empty());
                when(sourceAdapter.snapshotForOrderCreation(SOURCE_ID)).thenReturn(Optional.of(new OrderSourceSnapshot(
                                OrderSourceType.AUCTION,
                                SOURCE_ID,
                                BUYER_ID,
                                SELLER_ID,
                                PRODUCT_ID,
                                "Binh go quy",
                                null,
                                money("1000000"),
                                money("1000000"))));
                saveReturnsEntityWithId();

                orderService.createFromSource(OrderSourceType.AUCTION, SOURCE_ID);

                ArgumentCaptor<OrderEntity> orderCaptor = ArgumentCaptor.forClass(OrderEntity.class);
                verify(orderRepository).save(orderCaptor.capture());
                OrderEntity saved = orderCaptor.getValue();
                assertThat(saved.getStatus()).isEqualTo(OrderStatus.PENDING_PAYMENT);
                assertThat(saved.getRemainingAmount()).isEqualByComparingTo("0.00");
                assertThat(saved.getPaidAt()).isNull();
                assertThat(saved.getPaymentDeadline()).isNotNull();
                verify(fulfillmentPort, never()).ensurePendingShipment(saved);
        }

        @Test
        void payRemainder_withValidPendingOrderWithdrawsFundsAndCreatesFulfillment() {
                OrderEntity order = pendingPaymentOrder(Instant.now().plusSeconds(3600));
                when(orderRepository.findByIdForUpdate(ORDER_ID)).thenReturn(Optional.of(order));
                when(orderRepository.save(any(OrderEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
                when(fulfillmentPort.findSnapshotByOrderId(ORDER_ID)).thenReturn(Optional.empty());
                when(shippingAddressQueryService.getOwnedAddressSnapshot(BUYER_ID, 11L))
                                .thenReturn(shippingAddress());

                var result = orderService.payRemainder(BUYER_ID, ORDER_ID, 11L);

                verify(walletService).payOrder(
                                eq(BUYER_ID),
                                eq(FinanceOperationKeys.orderPayment(ORDER_ID, BUYER_ID)),
                                eq(money("9000000")),
                                eq(ORDER_ID));
                verify(fulfillmentPort).ensurePendingShipment(order);
                assertThat(order.getStatus()).isEqualTo(OrderStatus.PAID);
                assertThat(order.getPaidAt()).isNotNull();
                assertThat(order.getShippingReceiverName()).isEqualTo("Nguyen Van A");
                assertThat(result.shippingAddress().provinceName()).isEqualTo("Ha Noi");
                assertThat(result.status()).isEqualTo(OrderStatus.PAID);
        }

        @Test
        void payRemainder_whenWalletFailsDoesNotPersistPaidOrder() {
                OrderEntity order = pendingPaymentOrder(Instant.now().plusSeconds(3600));
                when(orderRepository.findByIdForUpdate(ORDER_ID)).thenReturn(Optional.of(order));
                when(shippingAddressQueryService.getOwnedAddressSnapshot(BUYER_ID, 11L))
                                .thenReturn(shippingAddress());
                org.mockito.Mockito.doThrow(new AppException(ErrorCode.WALLET_INSUFFICIENT_AVAILABLE_BALANCE))
                                .when(walletService)
                                .payOrder(any(), any(), any(), any());

                assertThatThrownBy(() -> orderService.payRemainder(BUYER_ID, ORDER_ID, 11L))
                                .isInstanceOf(AppException.class)
                                .satisfies(throwable -> assertThat(((AppException) throwable).getErrorCode())
                                                .isEqualTo(ErrorCode.WALLET_INSUFFICIENT_AVAILABLE_BALANCE));

                assertThat(order.getStatus()).isEqualTo(OrderStatus.PENDING_PAYMENT);
                verify(orderRepository, never()).save(any(OrderEntity.class));
                verify(fulfillmentPort, never()).ensurePendingShipment(any(OrderEntity.class));
        }

        @Test
        void payRemainder_withZeroRemainingSkipsWalletAndCreatesFulfillment() {
                OrderEntity order = pendingPaymentOrder(Instant.now().plusSeconds(3600));
                order.setRemainingAmount(money("0"));
                when(orderRepository.findByIdForUpdate(ORDER_ID)).thenReturn(Optional.of(order));
                when(orderRepository.save(any(OrderEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
                when(shippingAddressQueryService.getOwnedAddressSnapshot(BUYER_ID, 11L))
                                .thenReturn(shippingAddress());
                when(fulfillmentPort.findSnapshotByOrderId(ORDER_ID)).thenReturn(Optional.empty());

                orderService.payRemainder(BUYER_ID, ORDER_ID, 11L);

                verify(walletService, never()).payOrder(any(), any(), any(), any());
                verify(fulfillmentPort).ensurePendingShipment(order);
                assertThat(order.getStatus()).isEqualTo(OrderStatus.PAID);
        }

        @Test
        void payRemainder_afterPaymentDeadlineThrowsBusinessError() {
                OrderEntity order = pendingPaymentOrder(Instant.now().minusSeconds(1));
                when(orderRepository.findByIdForUpdate(ORDER_ID)).thenReturn(Optional.of(order));

                assertThatThrownBy(() -> orderService.payRemainder(BUYER_ID, ORDER_ID, 11L))
                                .isInstanceOf(AppException.class)
                                .satisfies(throwable -> assertThat(((AppException) throwable).getErrorCode())
                                                .isEqualTo(ErrorCode.ORDER_PAYMENT_DEADLINE_EXCEEDED));

                verify(walletService, never()).payOrder(any(), any(), any(), any());
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
                verify(walletService, never()).creditSellerForfeitCompensation(any(), any(), any(), any());
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
                verify(walletService).creditSellerForfeitCompensation(
                                eq(SELLER_ID),
                                eq(FinanceOperationKeys.orderForfeitSeller(ORDER_ID)),
                                eq(money("900000")),
                                eq(ORDER_ID));
                verify(platformRevenueService).recordRevenue(
                                eq(PlatformRevenueType.FORFEITED_DEPOSIT_FEE),
                                eq(money("100000")),
                                eq(BUYER_ID),
                                eq(WalletReferenceType.ORDER),
                                eq(ORDER_ID),
                                eq(FinanceOperationKeys.orderForfeitPlatform(ORDER_ID)));
                verify(sourceAdapter).onPaymentCanceled(order);
        }

        @Test
        void cancelForShipmentDeadline_refundsFullOrderAndReopensSource() {
                OrderEntity order = baseOrder();
                order.setStatus(OrderStatus.PAID);
                when(orderRepository.findByIdForUpdate(ORDER_ID)).thenReturn(Optional.of(order));
                when(orderRepository.save(any(OrderEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

                boolean canceled = orderService.cancelForShipmentDeadline(ORDER_ID);

                assertThat(canceled).isTrue();
                assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELED);
                assertThat(order.getCancelReason()).isEqualTo("SHIPMENT_DEADLINE_EXCEEDED");
                assertThat(order.getBuyerRefundAmount()).isEqualByComparingTo("10000000.00");
                assertThat(order.getRefundedAt()).isNotNull();
                verify(walletService).refundOrder(
                                eq(BUYER_ID),
                                eq(FinanceOperationKeys.orderShipmentDeadlineRefund(ORDER_ID)),
                                eq(money("10000000")),
                                eq(ORDER_ID));
                verify(sourceAdapter).onShipmentCanceled(order);
                verify(sourceAdapter, never()).onPaymentCanceled(any());
                verify(sourceAdapter, never()).onOrderCompleted(any());
        }

        @Test
        void cancelForShipmentDeadline_skipsOrderOutsidePaidState() {
                OrderEntity order = baseOrder();
                order.setStatus(OrderStatus.FULFILLING);
                when(orderRepository.findByIdForUpdate(ORDER_ID)).thenReturn(Optional.of(order));

                boolean canceled = orderService.cancelForShipmentDeadline(ORDER_ID);

                assertThat(canceled).isFalse();
                verify(walletService, never()).refundOrder(any(), any(), any(), any());
                verify(orderRepository, never()).save(any());
                verify(sourceAdapter, never()).onShipmentCanceled(any());
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
                verify(walletService).creditSellerPayout(
                                eq(SELLER_ID),
                                eq(FinanceOperationKeys.orderCompletionPayout(ORDER_ID)),
                                eq(money("9500000")),
                                eq(ORDER_ID));
                verify(platformRevenueService).recordRevenue(
                                eq(PlatformRevenueType.SALE_COMMISSION),
                                eq(money("500000")),
                                eq(SELLER_ID),
                                eq(WalletReferenceType.ORDER),
                                eq(ORDER_ID),
                                eq(FinanceOperationKeys.orderCompletionCommission(ORDER_ID)));
                verify(sourceAdapter).onOrderCompleted(order);
        }

        @Test
        void getSellerSalesSummary_aggregatesCompletedAndForfeitedIncomeByDay() {
                Instant completedAt = Instant.parse("2026-06-05T10:00:00Z");
                OrderEntity completed = baseOrder();
                completed.setStatus(OrderStatus.COMPLETED);
                completed.setCompletedAt(completedAt);
                completed.setPlatformCommissionAmount(money("500000"));
                completed.setSellerPayoutAmount(money("9500000"));

                OrderEntity forfeited = baseOrder();
                forfeited.setId(92L);
                forfeited.setStatus(OrderStatus.CANCELED);
                forfeited.setCanceledAt(Instant.parse("2026-06-05T12:00:00Z"));
                forfeited.setForfeitedDepositSellerAmount(money("900000"));

                when(orderRepository.findSellerRealizedOrders(
                                eq(SELLER_ID),
                                eq(OrderStatus.COMPLETED),
                                any(Instant.class))).thenReturn(List.of(completed, forfeited));

                var result = orderService.getSellerSalesSummary(SELLER_ID, "30D");

                assertThat(result.grossSales()).isEqualByComparingTo("10000000.00");
                assertThat(result.platformCommission()).isEqualByComparingTo("500000.00");
                assertThat(result.sellerPayout()).isEqualByComparingTo("9500000.00");
                assertThat(result.forfeitedDepositIncome()).isEqualByComparingTo("900000.00");
                assertThat(result.totalRealizedIncome()).isEqualByComparingTo("10400000.00");
                assertThat(result.completedOrders()).isEqualTo(1);
                assertThat(result.daily()).hasSize(1);
        }

        @Test
        void getSellerSalesSummary_allUsesNonNullableRepositoryQuery() {
                when(orderRepository.findAllSellerRealizedOrders(SELLER_ID, OrderStatus.COMPLETED))
                                .thenReturn(List.of());

                var result = orderService.getSellerSalesSummary(SELLER_ID, "ALL");

                assertThat(result.range()).isEqualTo("ALL");
                assertThat(result.totalRealizedIncome()).isEqualByComparingTo("0.00");
                verify(orderRepository, never()).findSellerRealizedOrders(
                                eq(SELLER_ID),
                                eq(OrderStatus.COMPLETED),
                                any(Instant.class));
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
                verify(walletService, never()).refundOrder(any(), any(), any(), any());
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
                verify(walletService).creditSellerPayout(
                                eq(SELLER_ID),
                                eq(FinanceOperationKeys.orderCompletionPayout(ORDER_ID)),
                                eq(money("9500000")),
                                eq(ORDER_ID));
                verify(platformRevenueService).recordRevenue(
                                eq(PlatformRevenueType.SALE_COMMISSION),
                                eq(money("500000")),
                                eq(SELLER_ID),
                                eq(WalletReferenceType.ORDER),
                                eq(ORDER_ID),
                                eq(FinanceOperationKeys.orderCompletionCommission(ORDER_ID)));
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
                assertThat(order.getBuyerRefundAmount()).isEqualByComparingTo("10000000.00");
                assertThat(order.getRefundedAt()).isNotNull();
                assertThat(result.status()).isEqualTo(OrderStatus.CANCELED);
                verify(walletService).refundOrder(
                                eq(BUYER_ID),
                                eq(FinanceOperationKeys.orderDisputeRefund(ORDER_ID)),
                                eq(money("10000000")),
                                eq(ORDER_ID));
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
                order.setProductTitle("Binh go quy");
                return order;
        }

        private ShippingAddressSnapshot shippingAddress() {
                return new ShippingAddressSnapshot(
                                "Nguyen Van A",
                                "0911222333",
                                "12 Pho Go",
                                "00001",
                                "Phuong Hang Bac",
                                "001",
                                "Quan Hoan Kiem",
                                "01",
                                "Ha Noi");
        }

        private OrderFulfillmentSnapshot shippedFulfillment() {
                return new OrderFulfillmentSnapshot(
                                11L,
                                ORDER_ID,
                                "SHIPPED",
                                null,
                                "THIRD_PARTY",
                                "Viettel Post",
                                "TRK-1",
                                Instant.now(),
                                null,
                                Instant.now().plusSeconds(3600));
        }

        private BigDecimal money(String value) {
                return new BigDecimal(value).setScale(2);
        }
}
