package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.core.config.EmailVerificationProperties;
import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.feature.identity.dto.request.RegisterReq;
import com.woodcert.auction.feature.identity.entity.EmailVerificationToken;
import com.woodcert.auction.feature.identity.entity.Role;
import com.woodcert.auction.feature.identity.entity.User;
import com.woodcert.auction.feature.identity.entity.UserStatus;
import com.woodcert.auction.feature.identity.repository.EmailVerificationTokenRepository;
import com.woodcert.auction.feature.identity.repository.RefreshTokenRepository;
import com.woodcert.auction.feature.identity.repository.RoleRepository;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import com.woodcert.auction.core.security.JwtService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private EmailVerificationTokenRepository emailVerificationTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private EmailVerificationProperties emailVerificationProperties;

    @Mock
    private ObjectProvider<JavaMailSender> mailSenderProvider;

    @InjectMocks
    private AuthServiceImpl authService;

    @Test
    @DisplayName("register normalizes +84 phone before duplicate check and save")
    void register_normalizesVietnamesePhone() {
        RegisterReq request = new RegisterReq(
                "user@example.com",
                "Password123",
                "Nguyen Van A",
                "+84987654321"
        );

        Role bidderRole = new Role();
        bidderRole.setId(1);
        bidderRole.setName("ROLE_BIDDER");

        when(userRepository.existsByEmail("user@example.com")).thenReturn(false);
        when(userRepository.existsByPhoneNumber("0987654321")).thenReturn(false);
        when(roleRepository.findByName("ROLE_BIDDER")).thenReturn(Optional.of(bidderRole));
        when(passwordEncoder.encode("Password123")).thenReturn("hashed-password");
        when(emailVerificationProperties.getTokenTtlSeconds()).thenReturn(900L);
        when(emailVerificationProperties.getResendCooldownSeconds()).thenReturn(60L);
        when(emailVerificationProperties.getVerificationLinkBaseUrl()).thenReturn("http://localhost:8080/api/v1/auth/verify-email");
        when(emailVerificationProperties.getFromAddress()).thenReturn("no-reply@woodcert.local");
        when(emailVerificationProperties.getSubject()).thenReturn("Verify your WoodCert email");
        when(mailSenderProvider.getIfAvailable()).thenReturn(null);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId("user-1");
            return user;
        });
        when(emailVerificationTokenRepository.save(any(EmailVerificationToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        authService.register(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertEquals("0987654321", userCaptor.getValue().getPhoneNumber());
        verify(emailVerificationTokenRepository).save(any(EmailVerificationToken.class));
    }

    @Test
    @DisplayName("verifyEmail activates the user and marks token as verified")
    void verifyEmail_activatesUser() {
        User user = new User();
        user.setId("user-1");
        user.setEmail("user@example.com");
        user.setStatus(UserStatus.UNVERIFIED);

        EmailVerificationToken token = new EmailVerificationToken();
        token.setId(1L);
        token.setTokenHash("hash");
        token.setUser(user);
        token.setExpiresAt(Instant.now().plusSeconds(3600));

        when(emailVerificationTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(token));
        when(emailVerificationTokenRepository.save(any(EmailVerificationToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        authService.verifyEmail("raw-token");

        assertEquals(UserStatus.ACTIVE, user.getStatus());
        assertNotNull(token.getVerifiedAt());
        verify(userRepository).save(user);
        verify(emailVerificationTokenRepository).save(token);
    }

    @Test
    @DisplayName("resendVerificationEmail issues a new token only for unverified accounts")
    void resendVerificationEmail_issuesTokenForUnverifiedUser() {
        User user = new User();
        user.setId("user-1");
        user.setEmail("user@example.com");
        user.setStatus(UserStatus.UNVERIFIED);

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(emailVerificationTokenRepository.findTopByUserAndVerifiedAtIsNullOrderByCreatedAtDesc(user))
                .thenReturn(Optional.empty());
        when(emailVerificationProperties.getTokenTtlSeconds()).thenReturn(900L);
        when(emailVerificationProperties.getResendCooldownSeconds()).thenReturn(60L);
        when(emailVerificationProperties.getVerificationLinkBaseUrl()).thenReturn("http://localhost:8080/api/v1/auth/verify-email");
        when(emailVerificationProperties.getFromAddress()).thenReturn("no-reply@woodcert.local");
        when(emailVerificationProperties.getSubject()).thenReturn("Verify your WoodCert email");
        when(mailSenderProvider.getIfAvailable()).thenReturn(null);
        when(emailVerificationTokenRepository.save(any(EmailVerificationToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        authService.resendVerificationEmail(" user@example.com ");

        verify(emailVerificationTokenRepository).deleteByUserAndVerifiedAtIsNull(user);
        verify(emailVerificationTokenRepository).save(any(EmailVerificationToken.class));
    }

    @Test
    @DisplayName("resendVerificationEmail rejects requests made before cooldown expires")
    void resendVerificationEmail_tooSoon() {
        User user = new User();
        user.setId("user-1");
        user.setEmail("user@example.com");
        user.setStatus(UserStatus.UNVERIFIED);

        EmailVerificationToken token = new EmailVerificationToken();
        token.setId(1L);
        token.setUser(user);
        token.setTokenHash("hash");
        token.setCreatedAt(Instant.now().minusSeconds(30));
        token.setExpiresAt(Instant.now().plusSeconds(900));

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(emailVerificationTokenRepository.findTopByUserAndVerifiedAtIsNullOrderByCreatedAtDesc(user))
                .thenReturn(Optional.of(token));
        when(emailVerificationProperties.getResendCooldownSeconds()).thenReturn(60L);

        AppException ex = assertThrows(AppException.class,
                () -> authService.resendVerificationEmail("user@example.com"));

        assertEquals(429, ex.getStatusCode());
    }
}
