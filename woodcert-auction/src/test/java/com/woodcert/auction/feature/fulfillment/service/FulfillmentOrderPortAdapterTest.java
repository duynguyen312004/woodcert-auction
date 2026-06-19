package com.woodcert.auction.feature.fulfillment.service;

import com.woodcert.auction.feature.fulfillment.config.FulfillmentProperties;
import com.woodcert.auction.feature.fulfillment.entity.FulfillmentStatus;
import com.woodcert.auction.feature.fulfillment.entity.OrderFulfillment;
import com.woodcert.auction.feature.fulfillment.repository.FulfillmentRepository;
import com.woodcert.auction.feature.order.entity.OrderEntity;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FulfillmentOrderPortAdapterTest {

    @Mock
    private FulfillmentRepository fulfillmentRepository;

    @Test
    void ensurePendingShipment_setsDeadlineFromPaidAt() {
        FulfillmentProperties properties = new FulfillmentProperties();
        properties.setShipmentDeadline(Duration.ofHours(72));
        FulfillmentOrderPortAdapter adapter = new FulfillmentOrderPortAdapter(
                fulfillmentRepository,
                properties);
        Instant paidAt = Instant.parse("2026-06-19T00:00:00Z");
        OrderEntity order = new OrderEntity();
        order.setId(91L);
        order.setBuyerId("buyer-1");
        order.setSellerId("seller-1");
        order.setPaidAt(paidAt);
        when(fulfillmentRepository.findByOrderId(91L)).thenReturn(Optional.empty());
        when(fulfillmentRepository.save(any(OrderFulfillment.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        adapter.ensurePendingShipment(order);

        ArgumentCaptor<OrderFulfillment> captor = ArgumentCaptor.forClass(OrderFulfillment.class);
        verify(fulfillmentRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(FulfillmentStatus.PENDING_SHIPMENT);
        assertThat(captor.getValue().getShipmentDeadline())
                .isEqualTo(Instant.parse("2026-06-22T00:00:00Z"));
    }
}
