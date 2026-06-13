package com.woodcert.auction.feature.identity.repository;

import com.woodcert.auction.feature.identity.entity.EmailVerificationToken;
import com.woodcert.auction.feature.identity.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {

    Optional<EmailVerificationToken> findByTokenHash(String tokenHash);

    Optional<EmailVerificationToken> findTopByUserAndVerifiedAtIsNullOrderByCreatedAtDesc(User user);

    long deleteByUserAndVerifiedAtIsNull(User user);
}
