package com.woodcert.auction.feature.fulfillment.repository;

import com.woodcert.auction.feature.fulfillment.entity.FulfillmentStatus;
import com.woodcert.auction.feature.fulfillment.entity.OrderFulfillment;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface FulfillmentRepository extends JpaRepository<OrderFulfillment, Long> {

    Optional<OrderFulfillment> findByOrderId(Long orderId);

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
            FROM OrderFulfillment f
            WHERE f.status = :status
              AND f.autoCompleteDeadline <= :now
            ORDER BY f.autoCompleteDeadline ASC, f.id ASC
            """)
    List<Long> findOverdueAutoCompleteIds(
            @Param("status") FulfillmentStatus status,
            @Param("now") Instant now,
            Pageable pageable);
}
