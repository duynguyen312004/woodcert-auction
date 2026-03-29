package com.woodcert.auction.core.security;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.woodcert.auction.core.config.JwtProperties;
import com.woodcert.auction.feature.identity.entity.Permission;
import com.woodcert.auction.feature.identity.entity.Role;
import com.woodcert.auction.feature.identity.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for generating JWTs using Nimbus JOSE.
 * Tokens are signed with HMAC (HS512) using the configured secret key.
 *
 * JWT Payload includes: userId, email, roles, permissions (as claims).
 * Token validation is handled by Spring OAuth2 Resource Server (JwtDecoder bean in SecurityConfig).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JwtService {

    private final JwtProperties jwtProperties;

    /**
     * Generate an access token for the given user.
     * Contains userId, email, roles, and permissions claims.
     *
     * @param user the authenticated user
     * @return signed JWT string
     */
    public String generateAccessToken(User user) {
        List<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());

        List<String> permissions = user.getRoles().stream()
                .flatMap(role -> role.getPermissions().stream())
                .map(Permission::getName)
                .distinct()
                .collect(Collectors.toList());

        Instant now = Instant.now();
        Instant expiry = now.plusSeconds(jwtProperties.getAccessTokenExpiration());

        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(user.getId())
                .claim("email", user.getEmail())
                .claim("roles", roles)
                .claim("permissions", permissions)
                .issuer("woodcert-auction")
                .issueTime(Date.from(now))
                .expirationTime(Date.from(expiry))
                .jwtID(UUID.randomUUID().toString())
                .build();

        return signToken(claimsSet);
    }

    /**
     * Generate a raw refresh token (random UUID).
     * The caller is responsible for hashing (SHA-256) before storing in DB.
     *
     * @return raw refresh token string
     */
    public String generateRefreshToken() {
        return UUID.randomUUID().toString();
    }

    /**
     * Get the configured refresh token expiration in seconds.
     */
    public long getRefreshTokenExpiration() {
        return jwtProperties.getRefreshTokenExpiration();
    }

    /**
     * Sign a JWTClaimsSet using HMAC-SHA512.
     */
    private String signToken(JWTClaimsSet claimsSet) {
        try {
            JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);
            SignedJWT signedJWT = new SignedJWT(header, claimsSet);
            signedJWT.sign(new MACSigner(jwtProperties.getSecretKey().getBytes()));
            return signedJWT.serialize();
        } catch (JOSEException e) {
            log.error("Failed to sign JWT token", e);
            throw new RuntimeException("Failed to sign JWT token", e);
        }
    }
}
