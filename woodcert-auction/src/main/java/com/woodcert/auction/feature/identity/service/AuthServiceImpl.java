package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.core.security.JwtService;
import com.woodcert.auction.feature.identity.dto.*;
import com.woodcert.auction.feature.identity.entity.RefreshToken;
import com.woodcert.auction.feature.identity.entity.Role;
import com.woodcert.auction.feature.identity.entity.User;
import com.woodcert.auction.feature.identity.entity.UserStatus;
import com.woodcert.auction.feature.identity.repository.RefreshTokenRepository;
import com.woodcert.auction.feature.identity.repository.RoleRepository;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Set;
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
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Override
    @Transactional
    public AuthRes login(LoginReq request) {
        // Authenticate via Spring Security AuthenticationManager
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );
        } catch (BadCredentialsException e) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }

        // Load user with roles + permissions
        User user = userRepository.findByEmail(request.email())
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
        // Check duplicates
        if (userRepository.existsByEmail(request.email())) {
            throw new AppException(ErrorCode.DUPLICATE_RESOURCE, "Email already exists");
        }
        if (request.phoneNumber() != null && userRepository.existsByPhoneNumber(request.phoneNumber())) {
            throw new AppException(ErrorCode.DUPLICATE_RESOURCE, "Phone number already exists");
        }

        // Find default role
        Role bidderRole = roleRepository.findByName("ROLE_BIDDER")
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Default role ROLE_BIDDER not found"));

        // Create user
        User user = new User();
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFullName(request.fullName());
        user.setPhoneNumber(request.phoneNumber());
        user.setStatus(UserStatus.UNVERIFIED);
        user.setRoles(Set.of(bidderRole));

        user = userRepository.save(user);

        log.info("User {} registered successfully", user.getEmail());
        return RegisterRes.fromEntity(user);
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
}
