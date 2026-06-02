package com.woodcert.auction.feature.order.service;

import com.woodcert.auction.feature.order.config.OrderProperties;
import com.woodcert.auction.feature.order.entity.OrderStatus;
import com.woodcert.auction.feature.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderPaymentScheduler {

    private static final int BATCH_SIZE = 50;

    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final OrderProperties orderProperties;

    @Scheduled(cron = "${order.payment-deadline-cron:0 */1 * * * *}")
    public void cancelOverduePayments() {
        if (!orderProperties.isSchedulerEnabled()) {
            return;
        }
        var ids = orderRepository.findOverduePaymentIds(
                OrderStatus.PENDING_PAYMENT, Instant.now(), PageRequest.of(0, BATCH_SIZE));
        for (Long id : ids) {
            try {
                orderService.cancelOverduePayment(id);
            } catch (Exception ex) {
                log.error("Failed to cancel overdue order {}: {}", id, ex.getMessage());
            }
        }
    }
}
