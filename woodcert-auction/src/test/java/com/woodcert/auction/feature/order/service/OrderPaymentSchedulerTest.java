package com.woodcert.auction.feature.order.service;

import com.woodcert.auction.feature.order.config.OrderProperties;
import com.woodcert.auction.feature.order.entity.OrderStatus;
import com.woodcert.auction.feature.order.repository.OrderRepository;
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
class OrderPaymentSchedulerTest {

    @Mock private OrderRepository orderRepository;
    @Mock private OrderService orderService;

    private OrderProperties orderProperties;
    private OrderPaymentScheduler scheduler;

    @BeforeEach
    void setUp() {
        orderProperties = new OrderProperties();
        scheduler = new OrderPaymentScheduler(orderRepository, orderService, orderProperties);
    }

    @Test
    void cancelOverduePayments_doesNothingWhenSchedulerDisabled() {
        orderProperties.setSchedulerEnabled(false);

        scheduler.cancelOverduePayments();

        verifyNoInteractions(orderRepository, orderService);
    }

    @Test
    void cancelOverduePayments_cancelsEachOverdueOrder() {
        when(orderRepository.findOverduePaymentIds(
                eq(OrderStatus.PENDING_PAYMENT),
                any(Instant.class),
                any(Pageable.class)
        )).thenReturn(List.of(1L, 2L));

        scheduler.cancelOverduePayments();

        verify(orderService).cancelOverduePayment(1L);
        verify(orderService).cancelOverduePayment(2L);
    }
}
