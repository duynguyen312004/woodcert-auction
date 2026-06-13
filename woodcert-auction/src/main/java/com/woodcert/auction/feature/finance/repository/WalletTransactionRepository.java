package com.woodcert.auction.feature.finance.repository;

import com.woodcert.auction.feature.finance.entity.WalletTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {

    Page<WalletTransaction> findByWalletIdOrderByCreatedAtDescIdDesc(Long walletId, Pageable pageable);
}
