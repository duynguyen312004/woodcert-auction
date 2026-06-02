package com.woodcert.auction.feature.fulfillment.service;

import com.woodcert.auction.feature.fulfillment.config.FulfillmentProperties;
import com.woodcert.auction.feature.fulfillment.entity.FulfillmentStatus;
import com.woodcert.auction.feature.fulfillment.repository.FulfillmentRepository;
import com.woodcert.auction.feature.order.entity.OrderStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FulfillmentSchedulerTest {

    @Mock private FulfillmentRepository fulfillmentRepository;
    @Mock private FulfillmentService fulfillmentService;

    private FulfillmentProperties fulfillmentProperties;
    private FulfillmentScheduler scheduler;

    @BeforeEach
    void setUp() {
        fulfillmentProperties = new FulfillmentProperties();
        scheduler = new FulfillmentScheduler(fulfillmentRepository, fulfillmentService, fulfillmentProperties);
    }

    @Test
    void autoCompleteOverdueFulfillments_doesNothingWhenSchedulerDisabled() {
        fulfillmentProperties.setSchedulerEnabled(false);

        scheduler.autoCompleteOverdueFulfillments();

        verifyNoInteractions(fulfillmentRepository, fulfillmentService);
    }

    @Test
    void autoCompleteOverdueFulfillments_completesEachOverdueShipment() {
        when(fulfillmentRepository.findOverdueAutoCompleteIds(
                eq(FulfillmentStatus.SHIPPED),
                eq(OrderStatus.DISPUTED),
                any(Instant.class),
                any(Pageable.class)
        )).thenReturn(List.of(1L, 2L));

        scheduler.autoCompleteOverdueFulfillments();

        verify(fulfillmentService).autoCompleteOverdueFulfillment(1L);
        verify(fulfillmentService).autoCompleteOverdueFulfillment(2L);
    }
}
