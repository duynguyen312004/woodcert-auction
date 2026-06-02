package com.woodcert.auction.feature.finance.repository;

import com.woodcert.auction.feature.finance.entity.PlatformRevenueTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PlatformRevenueTransactionRepository extends JpaRepository<PlatformRevenueTransaction, Long> {

    boolean existsByOperationKey(String operationKey);

    Page<PlatformRevenueTransaction> findAllByOrderByCreatedAtDescIdDesc(Pageable pageable);

    @Query("""
            SELECT t.type, COALESCE(SUM(t.amount), 0), COUNT(t.id)
            FROM PlatformRevenueTransaction t
            GROUP BY t.type
            """)
    List<Object[]> sumAmountAndCountByType();

    default BigDecimal totalAmount() {
        return sumAmountAndCountByType().stream()
                .map(row -> (BigDecimal) row[1])
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
