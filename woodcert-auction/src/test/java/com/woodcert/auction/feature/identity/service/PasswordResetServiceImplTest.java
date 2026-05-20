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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith({MockitoExtension.class, OutputCaptureExtension.class})
class PasswordResetServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock
    private RefreshTokenRepository refreshTokenRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private PasswordResetProperties passwordResetProperties;
    @Mock
    private IdentityTokenService identityTokenService;
    @Mock
    private IdentityEmailService identityEmailService;

    private PasswordResetServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new PasswordResetServiceImpl(
                userRepository,
                passwordResetTokenRepository,
                refreshTokenRepository,
                passwordEncoder,
                passwordResetProperties,
                identityTokenService,
                identityEmailService);
    }

    @Test
    void requestPasswordReset_savesHashedTokenAndSendsEmailWithoutLoggingEmail(CapturedOutput output) {
        User user = activeUser();
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(identityTokenService.generateRawToken()).thenReturn("raw-reset-token");
        when(identityTokenService.hash("raw-reset-token")).thenReturn("hashed-reset-token");
        when(passwordResetProperties.getTokenTtlSeconds()).thenReturn(900L);

        service.requestPasswordReset(" user@example.com ");

        ArgumentCaptor<PasswordResetToken> tokenCaptor = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(passwordResetTokenRepository).deleteByUserAndUsedAtIsNull(user);
        verify(passwordResetTokenRepository).save(tokenCaptor.capture());
        verify(identityEmailService).sendPasswordResetEmail(user, "raw-reset-token");
        assertThat(tokenCaptor.getValue().getTokenHash()).isEqualTo("hashed-reset-token");
        assertThat(tokenCaptor.getValue().getUser()).isSameAs(user);
        assertThat(tokenCaptor.getValue().getExpiresAt()).isAfter(Instant.now());
        assertThat(output).doesNotContain("user@example.com");
    }

    @Test
    void requestPasswordReset_withinCooldownSilentlyNoOps() {
        User user = activeUser();
        PasswordResetToken latestToken = new PasswordResetToken();
        latestToken.setUser(user);
        latestToken.setCreatedAt(Instant.now().minusSeconds(30));

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordResetProperties.getRequestCooldownSeconds()).thenReturn(60L);
        when(passwordResetTokenRepository.findTopByUserAndUsedAtIsNullOrderByCreatedAtDesc(user))
                .thenReturn(Optional.of(latestToken));

        service.requestPasswordReset("user@example.com");

        verify(passwordResetTokenRepository, never()).deleteByUserAndUsedAtIsNull(any());
        verify(passwordResetTokenRepository, never()).save(any());
        verify(identityEmailService, never()).sendPasswordResetEmail(any(), any());
    }

    @Test
    void resetPassword_updatesPasswordMarksTokenUsedAndRevokesRefreshTokens() {
        User user = activeUser();
        PasswordResetToken token = resetToken(user);
        when(identityTokenService.hash("raw-token")).thenReturn("hashed-token");
        when(passwordResetTokenRepository.findByTokenHash("hashed-token")).thenReturn(Optional.of(token));
        when(passwordEncoder.encode("NewPassword123")).thenReturn("new-hash");

        service.resetPassword("raw-token", "NewPassword123");

        assertThat(user.getPasswordHash()).isEqualTo("new-hash");
        assertThat(token.getUsedAt()).isNotNull();
        verify(userRepository).save(user);
        verify(passwordResetTokenRepository).save(token);
        verify(refreshTokenRepository).revokeAllByUser(user);
    }

    @Test
    void resetPassword_rejectsUsedToken() {
        User user = activeUser();
        PasswordResetToken token = resetToken(user);
        token.setUsedAt(Instant.now());
        when(identityTokenService.hash("raw-token")).thenReturn("hashed-token");
        when(passwordResetTokenRepository.findByTokenHash("hashed-token")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> service.resetPassword("raw-token", "NewPassword123"))
                .isInstanceOfSatisfying(AppException.class, ex ->
                        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.PASSWORD_RESET_TOKEN_INVALID));
    }

    @Test
    void resetPassword_rejectsExpiredToken() {
        User user = activeUser();
        PasswordResetToken token = resetToken(user);
        token.setExpiresAt(Instant.now().minusSeconds(1));
        when(identityTokenService.hash("raw-token")).thenReturn("hashed-token");
        when(passwordResetTokenRepository.findByTokenHash("hashed-token")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> service.resetPassword("raw-token", "NewPassword123"))
                .isInstanceOfSatisfying(AppException.class, ex ->
                        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.PASSWORD_RESET_TOKEN_EXPIRED));
    }

    private User activeUser() {
        User user = new User();
        user.setId("user-1");
        user.setEmail("user@example.com");
        user.setFullName("User One");
        user.setStatus(UserStatus.ACTIVE);
        return user;
    }

    private PasswordResetToken resetToken(User user) {
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setTokenHash("hashed-token");
        token.setExpiresAt(Instant.now().plusSeconds(900));
        return token;
    }
}
