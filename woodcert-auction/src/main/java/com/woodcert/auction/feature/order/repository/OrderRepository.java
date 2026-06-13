package com.woodcert.auction.feature.order.repository;

import com.woodcert.auction.feature.order.entity.OrderEntity;
import com.woodcert.auction.feature.order.entity.OrderSourceType;
import com.woodcert.auction.feature.order.entity.OrderStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.Collection;
import java.util.List;

public interface OrderRepository extends JpaRepository<OrderEntity, Long> {

    Optional<OrderEntity> findBySourceTypeAndSourceId(OrderSourceType sourceType, Long sourceId);

    List<OrderEntity> findBySourceTypeAndSourceIdIn(OrderSourceType sourceType, Collection<Long> sourceIds);

    Page<OrderEntity> findByBuyerIdOrderByCreatedAtDescIdDesc(String buyerId, Pageable pageable);

    Page<OrderEntity> findByBuyerIdAndStatusOrderByCreatedAtDescIdDesc(
            String buyerId,
            OrderStatus status,
            Pageable pageable);

    Page<OrderEntity> findBySellerIdOrderByCreatedAtDescIdDesc(String sellerId, Pageable pageable);

    Page<OrderEntity> findBySellerIdAndStatusOrderByCreatedAtDescIdDesc(
            String sellerId,
            OrderStatus status,
            Pageable pageable);

    @Query("""
            SELECT o.status, COUNT(o)
            FROM OrderEntity o
            WHERE o.buyerId = :buyerId
            GROUP BY o.status
            """)
    List<Object[]> countByBuyerIdGroupedByStatus(@Param("buyerId") String buyerId);

    @Query("""
            SELECT o.status, COUNT(o)
            FROM OrderEntity o
            WHERE o.sellerId = :sellerId
            GROUP BY o.status
            """)
    List<Object[]> countBySellerIdGroupedByStatus(@Param("sellerId") String sellerId);

    @Query("""
            SELECT o
            FROM OrderEntity o
            WHERE o.sellerId = :sellerId
              AND (
                    (o.status = :completedStatus
                     AND o.completedAt >= :from)
                    OR
                    (o.forfeitedDepositSellerAmount IS NOT NULL
                     AND o.forfeitedDepositSellerAmount > 0
                     AND o.canceledAt >= :from)
              )
            """)
    List<OrderEntity> findSellerRealizedOrders(
            @Param("sellerId") String sellerId,
            @Param("completedStatus") OrderStatus completedStatus,
            @Param("from") Instant from);

    @Query("""
            SELECT o
            FROM OrderEntity o
            WHERE o.sellerId = :sellerId
              AND (
                    o.status = :completedStatus
                    OR
                    (o.forfeitedDepositSellerAmount IS NOT NULL
                     AND o.forfeitedDepositSellerAmount > 0)
              )
            """)
    List<OrderEntity> findAllSellerRealizedOrders(
            @Param("sellerId") String sellerId,
            @Param("completedStatus") OrderStatus completedStatus);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT o
            FROM OrderEntity o
            WHERE o.id = :id
            """)
    Optional<OrderEntity> findByIdForUpdate(@Param("id") Long id);

    @Query("""
            SELECT o.id
            FROM OrderEntity o
            WHERE o.status = :status
              AND o.paymentDeadline <= :now
            ORDER BY o.paymentDeadline ASC, o.id ASC
            """)
    List<Long> findOverduePaymentIds(
            @Param("status") OrderStatus status,
            @Param("now") Instant now,
            Pageable pageable);
}
