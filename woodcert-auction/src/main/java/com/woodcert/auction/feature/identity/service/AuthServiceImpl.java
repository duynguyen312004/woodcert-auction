package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.core.config.EmailVerificationProperties;
import com.woodcert.auction.core.security.JwtService;
import com.woodcert.auction.feature.identity.dto.request.LoginReq;
import com.woodcert.auction.feature.identity.dto.request.RegisterReq;
import com.woodcert.auction.feature.identity.dto.response.AuthRes;
import com.woodcert.auction.feature.identity.dto.response.RefreshRes;
import com.woodcert.auction.feature.identity.dto.response.RegisterRes;
import com.woodcert.auction.feature.identity.entity.EmailVerificationToken;
import com.woodcert.auction.feature.identity.entity.RefreshToken;
import com.woodcert.auction.feature.identity.entity.Role;
import com.woodcert.auction.feature.identity.entity.User;
import com.woodcert.auction.feature.identity.entity.UserStatus;
import com.woodcert.auction.feature.identity.repository.EmailVerificationTokenRepository;
import com.woodcert.auction.feature.identity.repository.RefreshTokenRepository;
import com.woodcert.auction.feature.identity.repository.RoleRepository;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import com.woodcert.auction.feature.identity.util.IdentityNormalizationUtils;
import org.springframework.beans.factory.ObjectProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Authentication service implementation.
 * Handles login, registration, token refresh (with rotation), and logout.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailVerificationProperties emailVerificationProperties;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Override
    @Transactional
    public AuthRes login(LoginReq request) {
        String normalizedEmail = IdentityNormalizationUtils.normalizeEmail(request.email());

        // Authenticate via Spring Security AuthenticationManager
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(normalizedEmail, request.password())
            );
        } catch (BadCredentialsException e) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }

        // Load user with roles + permissions
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_CREDENTIALS));

        // Check user status
        if (user.getStatus() == UserStatus.BANNED) {
            throw new AppException(ErrorCode.ACCOUNT_BANNED);
        }
        if (user.getStatus() == UserStatus.UNVERIFIED) {
            throw new AppException(ErrorCode.ACCOUNT_UNVERIFIED);
        }

        // Generate tokens
        String accessToken = jwtService.generateAccessToken(user);
        String rawRefreshToken = jwtService.generateRefreshToken();

        // Save hashed refresh token to DB
        saveRefreshToken(user, rawRefreshToken);

        List<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());

        log.info("User {} logged in successfully", user.getEmail());
        return new AuthRes(accessToken, rawRefreshToken, roles);
    }

    @Override
    @Transactional
    public RegisterRes register(RegisterReq request) {
        String normalizedEmail = IdentityNormalizationUtils.normalizeEmail(request.email());
        String normalizedFullName = request.fullName().trim();
        String normalizedPhoneNumber = IdentityNormalizationUtils.normalizeVietnamesePhoneNullable(request.phoneNumber());

        // Check duplicates
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new AppException(ErrorCode.DUPLICATE_RESOURCE, "Email already exists");
        }
        if (normalizedPhoneNumber != null && userRepository.existsByPhoneNumber(normalizedPhoneNumber)) {
            throw new AppException(ErrorCode.DUPLICATE_RESOURCE, "Phone number already exists");
        }

        // Find default role
        Role bidderRole = roleRepository.findByName("ROLE_BIDDER")
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Default role ROLE_BIDDER not found"));

        // Create user
        User user = new User();
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFullName(normalizedFullName);
        user.setPhoneNumber(normalizedPhoneNumber);
        user.setStatus(UserStatus.UNVERIFIED);
        user.setRoles(Set.of(bidderRole));

        user = userRepository.save(user);
        issueAndSendVerificationToken(user);

        log.info("User {} registered successfully", user.getEmail());
        return RegisterRes.fromEntity(user);
    }

    @Override
    @Transactional
    public void verifyEmail(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new AppException(ErrorCode.EMAIL_VERIFICATION_TOKEN_INVALID);
        }

        EmailVerificationToken verificationToken = emailVerificationTokenRepository.findByTokenHash(hashToken(rawToken))
                .orElseThrow(() -> new AppException(ErrorCode.EMAIL_VERIFICATION_TOKEN_INVALID));

        if (verificationToken.getVerifiedAt() != null) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_VERIFIED);
        }
        if (verificationToken.getExpiresAt().isBefore(Instant.now())) {
            throw new AppException(ErrorCode.EMAIL_VERIFICATION_TOKEN_EXPIRED);
        }

        User user = verificationToken.getUser();
        if (user.getStatus() == UserStatus.ACTIVE) {
            verificationToken.setVerifiedAt(Instant.now());
            emailVerificationTokenRepository.save(verificationToken);
            throw new AppException(ErrorCode.EMAIL_ALREADY_VERIFIED);
        }

        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);

        verificationToken.setVerifiedAt(Instant.now());
        emailVerificationTokenRepository.save(verificationToken);
        emailVerificationTokenRepository.deleteByUserAndVerifiedAtIsNull(user);

        log.info("Email verified successfully for user {}", user.getEmail());
    }

    @Override
    @Transactional
    public void resendVerificationEmail(String email) {
        String normalizedEmail = IdentityNormalizationUtils.normalizeEmail(email);
        if (normalizedEmail == null) {
            return;
        }

        userRepository.findByEmail(normalizedEmail).ifPresent(user -> {
            if (user.getStatus() != UserStatus.UNVERIFIED) {
                return;
            }

            emailVerificationTokenRepository.findTopByUserAndVerifiedAtIsNullOrderByCreatedAtDesc(user)
                    .ifPresent(latestToken -> {
                        Instant cooldownDeadline = latestToken.getCreatedAt()
                                .plusSeconds(emailVerificationProperties.getResendCooldownSeconds());
                        if (cooldownDeadline.isAfter(Instant.now())) {
                            throw new AppException(ErrorCode.EMAIL_VERIFICATION_RESEND_TOO_SOON);
                        }
                    });

            emailVerificationTokenRepository.deleteByUserAndVerifiedAtIsNull(user);
            issueAndSendVerificationToken(user);
            log.info("Verification email resent for user {}", user.getEmail());
        });
    }

    @Override
    @Transactional
    public RefreshRes refresh(String rawRefreshToken) {
        String tokenHash = hashToken(rawRefreshToken);

        RefreshToken storedToken = refreshTokenRepository.findByToken(tokenHash)
                .orElseThrow(() -> new AppException(ErrorCode.TOKEN_INVALID));

        // Validate token
        if (storedToken.isRevoked()) {
            throw new AppException(ErrorCode.TOKEN_INVALID);
        }
        if (storedToken.getExpiresAt().isBefore(Instant.now())) {
            throw new AppException(ErrorCode.TOKEN_EXPIRED);
        }

        // Revoke old token (rotation)
        storedToken.setRevoked(true);
        refreshTokenRepository.save(storedToken);

        // Generate new tokens
        User user = storedToken.getUser();
        String newAccessToken = jwtService.generateAccessToken(user);
        String newRawRefreshToken = jwtService.generateRefreshToken();

        // Save new hashed refresh token
        saveRefreshToken(user, newRawRefreshToken);

        log.info("Token refreshed for user {}", user.getEmail());
        return new RefreshRes(newAccessToken, newRawRefreshToken);
    }

    @Override
    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return;
        }

        String tokenHash = hashToken(rawRefreshToken);
        refreshTokenRepository.findByToken(tokenHash).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
            log.info("User {} logged out", token.getUser().getEmail());
        });
    }

    // --- Private helpers ---

    /**
     * Save a hashed refresh token to DB.
     */
    private void saveRefreshToken(User user, String rawToken) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken(hashToken(rawToken));
        refreshToken.setUser(user);
        refreshToken.setExpiresAt(Instant.now().plusSeconds(jwtService.getRefreshTokenExpiration()));
        refreshToken.setRevoked(false);
        refreshTokenRepository.save(refreshToken);
    }

    /**
     * Create a new verification token, persist it, and send the corresponding email.
     */
    private void issueAndSendVerificationToken(User user) {
        String rawToken = UUID.randomUUID().toString();

        EmailVerificationToken verificationToken = new EmailVerificationToken();
        verificationToken.setTokenHash(hashToken(rawToken));
        verificationToken.setUser(user);
        verificationToken.setExpiresAt(Instant.now().plusSeconds(emailVerificationProperties.getTokenTtlSeconds()));
        verificationToken.setVerifiedAt(null);
        emailVerificationTokenRepository.save(verificationToken);

        sendVerificationEmail(user, rawToken);
    }

    /**
     * Send the verification email if SMTP is configured.
     * If no mail sender is available, log the link so the dev environment remains usable.
     */
    private void sendVerificationEmail(User user, String rawToken) {
        String verificationUrl = buildVerificationUrl(rawToken);
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();

        if (mailSender == null) {
            log.warn("Mail sender is not configured. Verification link for {}: {}", user.getEmail(), verificationUrl);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            if (hasText(emailVerificationProperties.getFromAddress())) {
                message.setFrom(emailVerificationProperties.getFromAddress());
            }
            message.setTo(user.getEmail());
            message.setSubject(emailVerificationProperties.getSubject());
            message.setText("""
                    Hello %s,

                    Please verify your email address by clicking the link below:
                    %s

                    This link expires in %d minutes.
                    """.formatted(
                    user.getFullName(),
                    verificationUrl,
                    Math.max(1, emailVerificationProperties.getTokenTtlSeconds() / 60)
            ));
            mailSender.send(message);
        } catch (Exception ex) {
            log.warn("Failed to send verification email to {}. The account was created, but the message could not be delivered.", user.getEmail(), ex);
        }
    }

    private String buildVerificationUrl(String rawToken) {
        return emailVerificationProperties.getVerificationLinkBaseUrl()
                + "?token="
                + URLEncoder.encode(rawToken, StandardCharsets.UTF_8);
    }

    /**
     * Hash a raw token using SHA-256.
     * Stored in DB as CHAR(64) hex string.
     */
    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

}
