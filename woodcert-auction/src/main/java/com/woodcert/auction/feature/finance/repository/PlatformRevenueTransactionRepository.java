package com.woodcert.auction.feature.finance.repository;

import com.woodcert.auction.feature.finance.entity.PlatformRevenueTransaction;
import com.woodcert.auction.feature.finance.entity.PlatformRevenueType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Repository
public interface PlatformRevenueTransactionRepository extends JpaRepository<PlatformRevenueTransaction, Long> {

    boolean existsByOperationKey(String operationKey);

    Page<PlatformRevenueTransaction> findAllByOrderByCreatedAtDescIdDesc(Pageable pageable);

    @Query("""
            SELECT t
            FROM PlatformRevenueTransaction t
            WHERE (:type IS NULL OR t.type = :type)
              AND (:from IS NULL OR t.createdAt >= :from)
              AND (:to IS NULL OR t.createdAt <= :to)
              AND (:query IS NULL
                   OR LOWER(COALESCE(t.sourceUserId, '')) LIKE LOWER(CONCAT('%', :query, '%'))
                   OR LOWER(t.operationKey) LIKE LOWER(CONCAT('%', :query, '%'))
                   OR STR(t.referenceId) LIKE CONCAT('%', :query, '%'))
            ORDER BY t.createdAt DESC, t.id DESC
            """)
    Page<PlatformRevenueTransaction> search(
            PlatformRevenueType type,
            Instant from,
            Instant to,
            String query,
            Pageable pageable);

    @Query("""
            SELECT t.type, COALESCE(SUM(t.amount), 0), COUNT(t.id)
            FROM PlatformRevenueTransaction t
            GROUP BY t.type
            """)
    List<Object[]> sumAmountAndCountByType();

    @Query("""
            SELECT t.type, COALESCE(SUM(t.amount), 0), COUNT(t.id)
            FROM PlatformRevenueTransaction t
            WHERE (:type IS NULL OR t.type = :type)
              AND (:from IS NULL OR t.createdAt >= :from)
              AND (:to IS NULL OR t.createdAt <= :to)
              AND (:query IS NULL
                   OR LOWER(COALESCE(t.sourceUserId, '')) LIKE LOWER(CONCAT('%', :query, '%'))
                   OR LOWER(t.operationKey) LIKE LOWER(CONCAT('%', :query, '%'))
                   OR STR(t.referenceId) LIKE CONCAT('%', :query, '%'))
            GROUP BY t.type
            """)
    List<Object[]> sumAmountAndCountByTypeFiltered(
            PlatformRevenueType type,
            Instant from,
            Instant to,
            String query);

    default BigDecimal totalAmount() {
        return sumAmountAndCountByType().stream()
                .map(row -> (BigDecimal) row[1])
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
