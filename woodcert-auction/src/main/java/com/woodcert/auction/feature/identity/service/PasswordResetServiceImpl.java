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
        // Bước 1: Chuẩn hóa email; email không hợp lệ được bỏ qua để không lộ thông tin tài khoản.
        String normalizedEmail = IdentityNormalizationUtils.normalizeEmail(email);
        if (normalizedEmail == null) {
            return;
        }

        userRepository.findByEmail(normalizedEmail).ifPresent(user -> {
            // Bước 2: Không gửi reset cho tài khoản bị khóa hoặc đang trong thời gian cooldown.
            if (user.getStatus() == UserStatus.BANNED || isWithinCooldown(user)) {
                return;
            }

            // Bước 3: Xóa token reset cũ chưa dùng để mỗi user chỉ còn một token hợp lệ.
            passwordResetTokenRepository.deleteByUserAndUsedAtIsNull(user);

            // Bước 4: Sinh token thô, lưu hash và thời hạn vào DB.
            String rawToken = identityTokenService.generateRawToken();
            PasswordResetToken resetToken = new PasswordResetToken();
            resetToken.setTokenHash(identityTokenService.hash(rawToken));
            resetToken.setUser(user);
            resetToken.setExpiresAt(Instant.now().plusSeconds(passwordResetProperties.getTokenTtlSeconds()));
            passwordResetTokenRepository.save(resetToken);

            // Bước 5: Gửi token thô qua email sau khi bản ghi reset đã được lưu.
            identityEmailService.sendPasswordResetEmail(user, rawToken);
        });

        log.info("Password reset request processed.");
    }

    @Override
    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        // Bước 1: Kiểm tra token thô từ email reset password.
        if (rawToken == null || rawToken.isBlank()) {
            throw new AppException(ErrorCode.PASSWORD_RESET_TOKEN_INVALID);
        }

        // Bước 2: Hash token thô rồi tìm bản ghi reset tương ứng.
        PasswordResetToken resetToken = passwordResetTokenRepository
                .findByTokenHash(identityTokenService.hash(rawToken))
                .orElseThrow(() -> new AppException(ErrorCode.PASSWORD_RESET_TOKEN_INVALID));

        // Bước 3: Chặn token đã dùng hoặc đã hết hạn.
        if (resetToken.getUsedAt() != null) {
            throw new AppException(ErrorCode.PASSWORD_RESET_TOKEN_INVALID);
        }
        if (resetToken.getExpiresAt().isBefore(Instant.now())) {
            throw new AppException(ErrorCode.PASSWORD_RESET_TOKEN_EXPIRED);
        }

        // Bước 4: Cập nhật mật khẩu mới ở dạng hash.
        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Bước 5: Đánh dấu token đã dùng và revoke toàn bộ refresh token cũ của user.
        resetToken.setUsedAt(Instant.now());
        passwordResetTokenRepository.save(resetToken);
        refreshTokenRepository.revokeAllByUser(user);

        log.info("Password reset completed.");
    }

    private boolean isWithinCooldown(User user) {
        // Bước 1: Cooldown <= 0 nghĩa là không giới hạn tần suất yêu cầu reset.
        long cooldownSeconds = passwordResetProperties.getRequestCooldownSeconds();
        if (cooldownSeconds <= 0) {
            return false;
        }

        // Bước 2: Dựa vào token reset chưa dùng mới nhất để xác định còn trong cooldown hay không.
        return passwordResetTokenRepository.findTopByUserAndUsedAtIsNullOrderByCreatedAtDesc(user)
                .map(PasswordResetToken::getCreatedAt)
                .map(createdAt -> createdAt.plusSeconds(cooldownSeconds).isAfter(Instant.now()))
                .orElse(false);
    }
}
