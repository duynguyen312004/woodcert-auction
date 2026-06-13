package com.woodcert.auction.feature.identity.controller;

import com.woodcert.auction.core.config.RefreshCookieProperties;
import com.woodcert.auction.core.dto.ApiResponse;
import com.woodcert.auction.feature.identity.dto.request.ForgotPasswordReq;
import com.woodcert.auction.feature.identity.dto.request.LoginReq;
import com.woodcert.auction.feature.identity.dto.request.ResendVerificationReq;
import com.woodcert.auction.feature.identity.dto.request.RegisterReq;
import com.woodcert.auction.feature.identity.dto.request.ResetPasswordReq;
import com.woodcert.auction.feature.identity.dto.response.AuthRes;
import com.woodcert.auction.feature.identity.dto.response.CsrfTokenRes;
import com.woodcert.auction.feature.identity.dto.response.RefreshRes;
import com.woodcert.auction.feature.identity.dto.response.RegisterRes;
import com.woodcert.auction.feature.identity.service.AuthService;
import com.woodcert.auction.feature.identity.service.IssuedAuthTokens;
import com.woodcert.auction.feature.identity.service.RotatedAuthTokens;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Authentication REST controller.
 * Handles login, registration, email verification, token refresh, and logout.
 * All endpoints under /api/v1/auth are public except /logout.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final RefreshCookieProperties cookieProperties;

    private static final String REFRESH_TOKEN_COOKIE = "refresh_token";
    private static final String CSRF_COOKIE = "XSRF-TOKEN";
    private static final String CSRF_HEADER = "X-XSRF-TOKEN";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    /**
     * POST /api/v1/auth/login
     * Authenticate user, return tokens. Also sets refresh token as HttpOnly cookie.
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthRes>> login(@RequestBody @Valid LoginReq request,
            HttpServletResponse response) {
        IssuedAuthTokens tokens = authService.login(request);
        setRefreshTokenCookie(response, tokens.rawRefreshToken());
        AuthRes authRes = new AuthRes(tokens.accessToken(), tokens.roles());
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
     * GET /api/v1/auth/verify-email?token=...
     * Verify a newly registered account using the email link.
     */
    @GetMapping("/verify-email")
    public ResponseEntity<ApiResponse<Void>> verifyEmail(@RequestParam("token") String token) {
        authService.verifyEmail(token);
        return ResponseEntity.ok(ApiResponse.success(null, "Email verified successfully"));
    }

    @GetMapping("/csrf")
    public ResponseEntity<ApiResponse<CsrfTokenRes>> csrf(HttpServletResponse response) {
        String token = generateCsrfToken();
        setCsrfCookie(response, token);
        return ResponseEntity.ok(ApiResponse.success(new CsrfTokenRes(token), "CSRF token issued"));
    }

    /**
     * POST /api/v1/auth/resend-verification
     * Resend the verification email if the account is still unverified.
     */
    @PostMapping("/resend-verification")
    public ResponseEntity<ApiResponse<Void>> resendVerification(@RequestBody @Valid ResendVerificationReq request) {
        authService.resendVerificationEmail(request.email());
        return ResponseEntity.ok(
                ApiResponse.success(
                        null,
                        "If the account exists and is unverified, a new verification email has been sent."
                )
        );
    }

    /**
     * POST /api/v1/auth/refresh
     * Refresh access token using the HttpOnly refresh-token cookie.
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<RefreshRes>> refresh(
            @CookieValue(name = REFRESH_TOKEN_COOKIE, required = false) String cookieRefreshToken,
            @CookieValue(name = CSRF_COOKIE, required = false) String csrfCookie,
            @RequestHeader(name = CSRF_HEADER, required = false) String csrfHeader,
            HttpServletResponse response) {

        if (cookieRefreshToken == null || cookieRefreshToken.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(401, "No refresh token provided"));
        }
        if (!isValidCsrf(csrfCookie, csrfHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(403, "Invalid CSRF token"));
        }

        RotatedAuthTokens tokens = authService.refresh(cookieRefreshToken);
        setRefreshTokenCookie(response, tokens.rawRefreshToken());
        RefreshRes refreshRes = new RefreshRes(tokens.accessToken());
        return ResponseEntity.ok(ApiResponse.success(refreshRes, "Token refreshed"));
    }

    /**
     * POST /api/v1/auth/logout
     * Revoke refresh token and clear cookie.
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @CookieValue(name = REFRESH_TOKEN_COOKIE, required = false) String cookieRefreshToken,
            @CookieValue(name = CSRF_COOKIE, required = false) String csrfCookie,
            @RequestHeader(name = CSRF_HEADER, required = false) String csrfHeader,
            HttpServletResponse response) {

        if (!isValidCsrf(csrfCookie, csrfHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(403, "Invalid CSRF token"));
        }

        authService.logout(cookieRefreshToken);
        clearRefreshTokenCookie(response);
        clearCsrfCookie(response);
        return ResponseEntity.ok(ApiResponse.success(null, "Logged out successfully"));
    }

    /**
     * POST /api/v1/auth/forgot-password
     * Initiate password reset. Always returns 200 to avoid email enumeration.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@RequestBody @Valid ForgotPasswordReq request) {
        authService.requestPasswordReset(request.email());
        return ResponseEntity.ok(
                ApiResponse.success(null,
                        "If the account exists, a password reset link has been sent to the registered email."));
    }

    /**
     * POST /api/v1/auth/reset-password
     * Complete password reset with token + new password.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@RequestBody @Valid ResetPasswordReq request) {
        authService.resetPassword(request.token(), request.newPassword());
        return ResponseEntity.ok(ApiResponse.success(null, "Password reset successfully. Please log in."));
    }

    // --- Cookie helpers ---

    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        ResponseCookie cookie = baseRefreshCookie(refreshToken)
                .maxAge(Duration.ofSeconds(Math.max(0, cookieProperties.getMaxAge())))
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearRefreshTokenCookie(HttpServletResponse response) {
        ResponseCookie cookie = baseRefreshCookie("")
                .maxAge(Duration.ZERO)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void setCsrfCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from(CSRF_COOKIE, token)
                .httpOnly(false)
                .secure(cookieProperties.isSecure())
                .sameSite(cookieProperties.getSameSite())
                .path(cookieProperties.getPath())
                .maxAge(Duration.ofSeconds(Math.max(0, cookieProperties.getMaxAge())))
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearCsrfCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(CSRF_COOKIE, "")
                .httpOnly(false)
                .secure(cookieProperties.isSecure())
                .sameSite(cookieProperties.getSameSite())
                .path(cookieProperties.getPath())
                .maxAge(Duration.ZERO)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private ResponseCookie.ResponseCookieBuilder baseRefreshCookie(String value) {
        return ResponseCookie.from(REFRESH_TOKEN_COOKIE, value)
                .httpOnly(true)
                .secure(cookieProperties.isSecure())
                .sameSite(cookieProperties.getSameSite())
                .path(cookieProperties.getPath());
    }

    private boolean isValidCsrf(String csrfCookie, String csrfHeader) {
        return csrfCookie != null
                && !csrfCookie.isBlank()
                && csrfHeader != null
                && csrfCookie.equals(csrfHeader);
    }

    private String generateCsrfToken() {
        byte[] randomBytes = new byte[32];
        SECURE_RANDOM.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }
}
