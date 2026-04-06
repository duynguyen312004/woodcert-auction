package com.woodcert.auction.feature.identity.controller;

import com.woodcert.auction.core.dto.ApiResponse;
import com.woodcert.auction.feature.identity.dto.request.LoginReq;
import com.woodcert.auction.feature.identity.dto.request.RefreshReq;
import com.woodcert.auction.feature.identity.dto.request.RegisterReq;
import com.woodcert.auction.feature.identity.dto.response.AuthRes;
import com.woodcert.auction.feature.identity.dto.response.RefreshRes;
import com.woodcert.auction.feature.identity.dto.response.RegisterRes;
import com.woodcert.auction.feature.identity.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication REST controller.
 * Handles login, registration, token refresh, and logout.
 * All endpoints under /api/v1/auth are public except /logout.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    private static final String REFRESH_TOKEN_COOKIE = "refresh_token";
    private static final String COOKIE_PATH = "/api/v1/auth";
    private static final int COOKIE_MAX_AGE = 604800; // 7 days

    /**
     * POST /api/v1/auth/login
     * Authenticate user, return tokens. Also sets refresh token as HttpOnly cookie.
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthRes>> login(@RequestBody @Valid LoginReq request,
            HttpServletResponse response) {
        AuthRes authRes = authService.login(request);
        setRefreshTokenCookie(response, authRes.refreshToken());
        return ResponseEntity.ok(ApiResponse.success(authRes, "Login successful"));
    }

    /**
     * POST /api/v1/auth/register
     * Register a new user account.
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<RegisterRes>> register(@RequestBody @Valid RegisterReq request) {
        RegisterRes registerRes = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(registerRes, "User registered successfully. Please verify your email."));
    }

    /**
     * POST /api/v1/auth/refresh
     * Refresh access token. Reads refresh token from:
     * 1. HttpOnly cookie (Web/SPA)
     * 2. Request body (Mobile fallback)
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<RefreshRes>> refresh(
            @RequestBody(required = false) @Valid RefreshReq request,
            @CookieValue(name = REFRESH_TOKEN_COOKIE, required = false) String cookieRefreshToken,
            HttpServletResponse response) {

        // Priority: body first (explicit intent), then cookie fallback (Web/SPA)
        String rawRefreshToken = null;
        if (request != null && request.refreshToken() != null && !request.refreshToken().isBlank()) {
            rawRefreshToken = request.refreshToken();
        }
        if (rawRefreshToken == null) {
            rawRefreshToken = cookieRefreshToken;
        }

        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(401, "No refresh token provided"));
        }

        RefreshRes refreshRes = authService.refresh(rawRefreshToken);
        setRefreshTokenCookie(response, refreshRes.refreshToken());
        return ResponseEntity.ok(ApiResponse.success(refreshRes, "Token refreshed"));
    }

    /**
     * POST /api/v1/auth/logout
     * Revoke refresh token and clear cookie.
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestBody(required = false) @Valid RefreshReq request,
            @CookieValue(name = REFRESH_TOKEN_COOKIE, required = false) String cookieRefreshToken,
            HttpServletResponse response) {

        // Priority: body first, then cookie
        String rawRefreshToken = null;
        if (request != null && request.refreshToken() != null && !request.refreshToken().isBlank()) {
            rawRefreshToken = request.refreshToken();
        }
        if (rawRefreshToken == null) {
            rawRefreshToken = cookieRefreshToken;
        }

        authService.logout(rawRefreshToken);
        clearRefreshTokenCookie(response);
        return ResponseEntity.ok(ApiResponse.success(null, "Logged out successfully"));
    }

    // --- Cookie helpers ---

    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        Cookie cookie = new Cookie(REFRESH_TOKEN_COOKIE, refreshToken);
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath(COOKIE_PATH);
        cookie.setMaxAge(COOKIE_MAX_AGE);
        response.addCookie(cookie);
    }

    private void clearRefreshTokenCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(REFRESH_TOKEN_COOKIE, null);
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath(COOKIE_PATH);
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }
}
