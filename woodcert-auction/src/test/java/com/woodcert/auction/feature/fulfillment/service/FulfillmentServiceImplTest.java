package com.woodcert.auction.feature.fulfillment.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.fulfillment.config.FulfillmentProperties;
import com.woodcert.auction.feature.fulfillment.entity.FulfillmentStatus;
import com.woodcert.auction.feature.fulfillment.entity.OrderFulfillment;
import com.woodcert.auction.feature.fulfillment.repository.FulfillmentRepository;
import com.woodcert.auction.feature.order.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FulfillmentServiceImplTest {

    private static final Long FULFILLMENT_ID = 41L;
    private static final Long ORDER_ID = 91L;
    private static final String BUYER_ID = "buyer-1";
    private static final String SELLER_ID = "seller-1";

    @Mock private FulfillmentRepository fulfillmentRepository;
    @Mock private OrderService orderService;

    private FulfillmentServiceImpl fulfillmentService;

    @BeforeEach
    void setUp() {
        fulfillmentService = new FulfillmentServiceImpl(
                fulfillmentRepository,
                new FulfillmentProperties(),
                orderService
        );
    }

    @Test
    void confirmShipping_marksOrderFulfillingAndStoresShipmentDetails() {
        OrderFulfillment fulfillment = fulfillment(FulfillmentStatus.PENDING_SHIPMENT);
        when(fulfillmentRepository.findByOrderIdForUpdate(ORDER_ID)).thenReturn(Optional.of(fulfillment));
        when(fulfillmentRepository.save(any(OrderFulfillment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        fulfillmentService.confirmShipping(SELLER_ID, ORDER_ID, "  TRACK-123  ");

        verify(orderService).markFulfilling(SELLER_ID, ORDER_ID);
        assertThat(fulfillment.getStatus()).isEqualTo(FulfillmentStatus.SHIPPED);
        assertThat(fulfillment.getTrackingCode()).isEqualTo("TRACK-123");
        assertThat(fulfillment.getShippedAt()).isNotNull();
        assertThat(fulfillment.getAutoCompleteDeadline()).isNotNull();
        verify(fulfillmentRepository).save(fulfillment);
        verify(orderService).getOrderDetail(SELLER_ID, ORDER_ID);
    }

    @Test
    void confirmShipping_rejectsNonOwner() {
        OrderFulfillment fulfillment = fulfillment(FulfillmentStatus.PENDING_SHIPMENT);
        when(fulfillmentRepository.findByOrderIdForUpdate(ORDER_ID)).thenReturn(Optional.of(fulfillment));

        assertThatThrownBy(() -> fulfillmentService.confirmShipping("seller-2", ORDER_ID, null))
                .isInstanceOf(AppException.class)
                .satisfies(throwable -> assertThat(((AppException) throwable).getErrorCode())
                        .isEqualTo(ErrorCode.ORDER_NOT_OWNED));

        verifyNoInteractions(orderService);
        verify(fulfillmentRepository, never()).save(any(OrderFulfillment.class));
    }

    @Test
    void confirmReceived_completesOrderAndMarksFulfillmentDelivered() {
        OrderFulfillment fulfillment = fulfillment(FulfillmentStatus.SHIPPED);
        when(fulfillmentRepository.findByOrderIdForUpdate(ORDER_ID)).thenReturn(Optional.of(fulfillment));
        when(fulfillmentRepository.save(any(OrderFulfillment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        fulfillmentService.confirmReceived(BUYER_ID, ORDER_ID);

        verify(orderService).completeFromFulfillment(ORDER_ID);
        assertThat(fulfillment.getStatus()).isEqualTo(FulfillmentStatus.DELIVERED);
        assertThat(fulfillment.getReceivedAt()).isNotNull();
        verify(fulfillmentRepository).save(fulfillment);
        verify(orderService).getOrderDetail(BUYER_ID, ORDER_ID);
    }

    @Test
    void autoCompleteOverdueFulfillment_withFutureDeadlineDoesNotComplete() {
        OrderFulfillment fulfillment = fulfillment(FulfillmentStatus.SHIPPED);
        fulfillment.setAutoCompleteDeadline(Instant.now().plusSeconds(3600));
        when(fulfillmentRepository.findByIdForUpdate(FULFILLMENT_ID)).thenReturn(Optional.of(fulfillment));

        boolean completed = fulfillmentService.autoCompleteOverdueFulfillment(FULFILLMENT_ID);

        assertThat(completed).isFalse();
        assertThat(fulfillment.getStatus()).isEqualTo(FulfillmentStatus.SHIPPED);
        verify(orderService, never()).completeFromFulfillment(any());
        verify(fulfillmentRepository, never()).save(any(OrderFulfillment.class));
    }

    @Test
    void autoCompleteOverdueFulfillment_forOverdueShipmentCompletesOrder() {
        OrderFulfillment fulfillment = fulfillment(FulfillmentStatus.SHIPPED);
        fulfillment.setAutoCompleteDeadline(Instant.now().minusSeconds(1));
        when(fulfillmentRepository.findByIdForUpdate(FULFILLMENT_ID)).thenReturn(Optional.of(fulfillment));
        when(fulfillmentRepository.save(any(OrderFulfillment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        boolean completed = fulfillmentService.autoCompleteOverdueFulfillment(FULFILLMENT_ID);

        assertThat(completed).isTrue();
        assertThat(fulfillment.getStatus()).isEqualTo(FulfillmentStatus.AUTO_COMPLETED);
        assertThat(fulfillment.getReceivedAt()).isNotNull();
        verify(orderService).completeFromFulfillment(ORDER_ID);
        verify(fulfillmentRepository).save(fulfillment);
    }

    private OrderFulfillment fulfillment(FulfillmentStatus status) {
        OrderFulfillment fulfillment = new OrderFulfillment();
        fulfillment.setId(FULFILLMENT_ID);
        fulfillment.setOrderId(ORDER_ID);
        fulfillment.setBuyerId(BUYER_ID);
        fulfillment.setSellerId(SELLER_ID);
        fulfillment.setStatus(status);
        return fulfillment;
    }
}
