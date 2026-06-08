package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.feature.identity.entity.User;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BuyerOrderProfileQueryServiceImpl implements BuyerOrderProfileQueryService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public Optional<BuyerOrderProfileSnapshot> findBuyerProfile(String buyerId) {
        if (buyerId == null || buyerId.isBlank()) {
            return Optional.empty();
        }
        return userRepository.findById(buyerId)
                .or(() -> userRepository.findByEmail(buyerId))
                .map(this::toSnapshot);
    }

    private BuyerOrderProfileSnapshot toSnapshot(User user) {
        return new BuyerOrderProfileSnapshot(
                user.getId(),
                user.getFullName(),
                user.getPhoneNumber(),
                user.getEmail()
        );
    }
}
