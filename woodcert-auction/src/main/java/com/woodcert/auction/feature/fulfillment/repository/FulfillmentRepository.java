package com.woodcert.auction.feature.fulfillment.repository;

import com.woodcert.auction.feature.fulfillment.entity.FulfillmentStatus;
import com.woodcert.auction.feature.fulfillment.entity.OrderFulfillment;
import com.woodcert.auction.feature.order.entity.OrderStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface FulfillmentRepository extends JpaRepository<OrderFulfillment, Long> {

    Optional<OrderFulfillment> findByOrderId(Long orderId);

    List<OrderFulfillment> findByOrderIdIn(Collection<Long> orderIds);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT f
            FROM OrderFulfillment f
            WHERE f.orderId = :orderId
            """)
    Optional<OrderFulfillment> findByOrderIdForUpdate(@Param("orderId") Long orderId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT f
            FROM OrderFulfillment f
            WHERE f.id = :id
            """)
    Optional<OrderFulfillment> findByIdForUpdate(@Param("id") Long id);

    @Query("""
            SELECT f.id
            FROM OrderFulfillment f, OrderEntity o
            WHERE f.status = :status
              AND o.id = f.orderId
              AND o.status = :orderStatus
              AND f.shipmentDeadline <= :now
            ORDER BY f.shipmentDeadline ASC, f.id ASC
            """)
    List<Long> findOverdueShipmentIds(
            @Param("status") FulfillmentStatus status,
            @Param("orderStatus") OrderStatus orderStatus,
            @Param("now") Instant now,
            Pageable pageable);

    @Query("""
            SELECT f.id
            FROM OrderFulfillment f, OrderEntity o
            WHERE f.status = :status
              AND o.id = f.orderId
              AND o.status <> :excludedOrderStatus
              AND f.autoCompleteDeadline <= :now
            ORDER BY f.autoCompleteDeadline ASC, f.id ASC
            """)
    List<Long> findOverdueAutoCompleteIds(
            @Param("status") FulfillmentStatus status,
            @Param("excludedOrderStatus") OrderStatus excludedOrderStatus,
            @Param("now") Instant now,
            Pageable pageable);
}
