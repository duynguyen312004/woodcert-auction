package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.core.config.PasswordResetProperties;
import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.identity.entity.PasswordResetToken;
import com.woodcert.auction.feature.identity.entity.User;
import com.woodcert.auction.feature.identity.entity.UserStatus;
import com.woodcert.auction.feature.identity.repository.PasswordResetTokenRepository;
import com.woodcert.auction.feature.identity.repository.RefreshTokenRepository;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import com.woodcert.auction.feature.identity.util.IdentityNormalizationUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetServiceImpl implements PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetProperties passwordResetProperties;
    private final IdentityTokenService identityTokenService;
    private final IdentityEmailService identityEmailService;

    @Override
    @Transactional
    public void requestPasswordReset(String email) {
        String normalizedEmail = IdentityNormalizationUtils.normalizeEmail(email);
        if (normalizedEmail == null) {
            return;
        }

        userRepository.findByEmail(normalizedEmail).ifPresent(user -> {
            if (user.getStatus() == UserStatus.BANNED || isWithinCooldown(user)) {
                return;
            }

            passwordResetTokenRepository.deleteByUserAndUsedAtIsNull(user);

            String rawToken = identityTokenService.generateRawToken();
            PasswordResetToken resetToken = new PasswordResetToken();
            resetToken.setTokenHash(identityTokenService.hash(rawToken));
            resetToken.setUser(user);
            resetToken.setExpiresAt(Instant.now().plusSeconds(passwordResetProperties.getTokenTtlSeconds()));
            passwordResetTokenRepository.save(resetToken);

            identityEmailService.sendPasswordResetEmail(user, rawToken);
        });

        log.info("Password reset request processed.");
    }

    @Override
    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new AppException(ErrorCode.PASSWORD_RESET_TOKEN_INVALID);
        }

        PasswordResetToken resetToken = passwordResetTokenRepository
                .findByTokenHash(identityTokenService.hash(rawToken))
                .orElseThrow(() -> new AppException(ErrorCode.PASSWORD_RESET_TOKEN_INVALID));

        if (resetToken.getUsedAt() != null) {
            throw new AppException(ErrorCode.PASSWORD_RESET_TOKEN_INVALID);
        }
        if (resetToken.getExpiresAt().isBefore(Instant.now())) {
            throw new AppException(ErrorCode.PASSWORD_RESET_TOKEN_EXPIRED);
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetToken.setUsedAt(Instant.now());
        passwordResetTokenRepository.save(resetToken);
        refreshTokenRepository.revokeAllByUser(user);

        log.info("Password reset completed.");
    }

    private boolean isWithinCooldown(User user) {
        long cooldownSeconds = passwordResetProperties.getRequestCooldownSeconds();
        if (cooldownSeconds <= 0) {
            return false;
        }

        return passwordResetTokenRepository.findTopByUserAndUsedAtIsNullOrderByCreatedAtDesc(user)
                .map(PasswordResetToken::getCreatedAt)
                .map(createdAt -> createdAt.plusSeconds(cooldownSeconds).isAfter(Instant.now()))
                .orElse(false);
    }
}
