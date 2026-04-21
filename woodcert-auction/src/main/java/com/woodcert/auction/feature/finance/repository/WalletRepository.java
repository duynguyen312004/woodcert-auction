package com.woodcert.auction.feature.finance.repository;

import com.woodcert.auction.feature.finance.entity.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, Long> {

    Optional<Wallet> findByUserId(String userId);
}
