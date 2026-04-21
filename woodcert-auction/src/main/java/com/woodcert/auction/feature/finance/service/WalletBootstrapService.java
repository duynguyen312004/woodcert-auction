package com.woodcert.auction.feature.finance.service;

import com.woodcert.auction.feature.finance.entity.Wallet;
import com.woodcert.auction.feature.finance.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class WalletBootstrapService {

    private final WalletRepository walletRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Wallet getOrCreateWallet(String userId) {
        return walletRepository.findByUserId(userId)
                .orElseGet(() -> createWallet(userId));
    }

    private Wallet createWallet(String userId) {
        Wallet wallet = new Wallet();
        wallet.setUserId(userId);
        wallet.setAvailableBalance(BigDecimal.ZERO);
        wallet.setFrozenBalance(BigDecimal.ZERO);
        try {
            return walletRepository.saveAndFlush(wallet);
        } catch (DataIntegrityViolationException ex) {
            return walletRepository.findByUserId(userId)
                    .orElseThrow(() -> ex);
        }
    }
}
