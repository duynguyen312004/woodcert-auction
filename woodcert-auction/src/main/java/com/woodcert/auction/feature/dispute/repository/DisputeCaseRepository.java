package com.woodcert.auction.feature.dispute.repository;

import com.woodcert.auction.feature.dispute.entity.DisputeCase;
import com.woodcert.auction.feature.dispute.entity.DisputeStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Optional;

@Repository
public interface DisputeCaseRepository extends JpaRepository<DisputeCase, Long> {

    Optional<DisputeCase> findFirstByOrderIdAndStatusInOrderByOpenedAtDescIdDesc(
            Long orderId,
            Collection<DisputeStatus> statuses);

    Optional<DisputeCase> findByIdAndOrderId(Long id, Long orderId);

    Page<DisputeCase> findByStatusInOrderByOpenedAtDescIdDesc(Collection<DisputeStatus> statuses, Pageable pageable);

    Page<DisputeCase> findAllByOrderByOpenedAtDescIdDesc(Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT d
            FROM DisputeCase d
            WHERE d.id = :id
            """)
    Optional<DisputeCase> findByIdForUpdate(@Param("id") Long id);
}
