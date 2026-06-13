package com.woodcert.auction.feature.identity.repository;

import com.woodcert.auction.feature.identity.entity.PasswordResetToken;
import com.woodcert.auction.feature.identity.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    Optional<PasswordResetToken> findTopByUserAndUsedAtIsNullOrderByCreatedAtDesc(User user);

    long deleteByUserAndUsedAtIsNull(User user);
}
