package com.woodcert.auction.feature.fulfillment.service;

import com.woodcert.auction.feature.fulfillment.config.FulfillmentProperties;
import com.woodcert.auction.feature.fulfillment.entity.FulfillmentStatus;
import com.woodcert.auction.feature.fulfillment.repository.FulfillmentRepository;
import com.woodcert.auction.feature.order.entity.OrderStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
public class FulfillmentScheduler {

    private static final int BATCH_SIZE = 50;

    private final FulfillmentRepository fulfillmentRepository;
    private final FulfillmentService fulfillmentService;
    private final FulfillmentProperties fulfillmentProperties;

    @Scheduled(cron = "${fulfillment.auto-complete-cron:0 */5 * * * *}")
    public void autoCompleteOverdueFulfillments() {
        if (!fulfillmentProperties.isSchedulerEnabled()) {
            return;
        }
        var ids = fulfillmentRepository.findOverdueAutoCompleteIds(
                FulfillmentStatus.SHIPPED,
                OrderStatus.DISPUTED,
                Instant.now(),
                PageRequest.of(0, BATCH_SIZE));
        for (Long id : ids) {
            try {
                fulfillmentService.autoCompleteOverdueFulfillment(id);
            } catch (Exception ex) {
                log.error("Failed to auto-complete fulfillment {}: {}", id, ex.getMessage());
            }
        }
    }
}
