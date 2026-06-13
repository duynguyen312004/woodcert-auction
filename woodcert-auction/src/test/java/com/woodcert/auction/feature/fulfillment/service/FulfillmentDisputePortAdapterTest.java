package com.woodcert.auction.feature.fulfillment.service;

import com.woodcert.auction.feature.fulfillment.entity.FulfillmentStatus;
import com.woodcert.auction.feature.fulfillment.entity.OrderFulfillment;
import com.woodcert.auction.feature.fulfillment.repository.FulfillmentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FulfillmentDisputePortAdapterTest {

    private static final Long ORDER_ID = 91L;

    @Mock private FulfillmentRepository fulfillmentRepository;

    @Test
    void markDisputeSellerWinsAutoCompletesFulfillment() {
        OrderFulfillment fulfillment = shippedFulfillment();
        when(fulfillmentRepository.findByOrderIdForUpdate(ORDER_ID)).thenReturn(Optional.of(fulfillment));
        when(fulfillmentRepository.save(any(OrderFulfillment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        FulfillmentDisputePortAdapter adapter = new FulfillmentDisputePortAdapter(fulfillmentRepository);

        adapter.markDisputeSellerWins(ORDER_ID);

        assertThat(fulfillment.getStatus()).isEqualTo(FulfillmentStatus.AUTO_COMPLETED);
        assertThat(fulfillment.getReceivedAt()).isNotNull();
        verify(fulfillmentRepository).save(fulfillment);
    }

    @Test
    void markDisputeBuyerWinsCancelsFulfillmentWithoutReceiptTime() {
        OrderFulfillment fulfillment = shippedFulfillment();
        when(fulfillmentRepository.findByOrderIdForUpdate(ORDER_ID)).thenReturn(Optional.of(fulfillment));
        when(fulfillmentRepository.save(any(OrderFulfillment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        FulfillmentDisputePortAdapter adapter = new FulfillmentDisputePortAdapter(fulfillmentRepository);

        adapter.markDisputeBuyerWins(ORDER_ID);

        assertThat(fulfillment.getStatus()).isEqualTo(FulfillmentStatus.CANCELED);
        assertThat(fulfillment.getReceivedAt()).isNull();
        verify(fulfillmentRepository).save(fulfillment);
    }

    private OrderFulfillment shippedFulfillment() {
        OrderFulfillment fulfillment = new OrderFulfillment();
        fulfillment.setOrderId(ORDER_ID);
        fulfillment.setStatus(FulfillmentStatus.SHIPPED);
        fulfillment.setShippedAt(Instant.now());
        return fulfillment;
    }
}
