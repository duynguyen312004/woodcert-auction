package com.woodcert.auction.feature.finance.repository;

import com.woodcert.auction.feature.finance.entity.VnPayDeposit;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface VnPayDepositRepository extends JpaRepository<VnPayDeposit, Long> {
    Optional<VnPayDeposit> findByTxnRef(String txnRef);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM VnPayDeposit d WHERE d.txnRef = :txnRef")
    Optional<VnPayDeposit> findByTxnRefForUpdate(@Param("txnRef") String txnRef);

    Page<VnPayDeposit> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);
}
