package com.woodcert.auction.feature.finance.repository;

import com.woodcert.auction.feature.finance.entity.WalletOperation;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WalletOperationRepository extends JpaRepository<WalletOperation, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<WalletOperation> findByOperationKey(String operationKey);
}
