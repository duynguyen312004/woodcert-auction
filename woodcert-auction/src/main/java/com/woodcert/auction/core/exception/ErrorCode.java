package com.woodcert.auction.core.exception;

import lombok.Getter;

/**
 * Centralized error codes for the application.
 * Feature-specific errors should be added here as the system grows.
 */
@Getter
public enum ErrorCode {

    // --- General ---
    UNCATEGORIZED(500, "Internal Server Error"),
    VALIDATION_FAILED(400, "Validation failed"),

    // --- Authentication & Authorization ---
    UNAUTHORIZED(401, "Unauthorized"),
    FORBIDDEN(403, "Access denied"),
    INVALID_CREDENTIALS(401, "Invalid email or password"),
    ACCOUNT_BANNED(403, "Account is banned"),
    ACCOUNT_UNVERIFIED(403, "Account is not verified"),
    EMAIL_VERIFICATION_TOKEN_INVALID(400, "Email verification token is invalid"),
    EMAIL_VERIFICATION_TOKEN_EXPIRED(400, "Email verification token has expired"),
    EMAIL_ALREADY_VERIFIED(409, "Email is already verified"),
    EMAIL_VERIFICATION_RESEND_TOO_SOON(429, "Please wait before requesting another verification email"),

    // --- Resource ---
    RESOURCE_NOT_FOUND(404, "Resource not found"),
    DUPLICATE_RESOURCE(409, "Resource already exists"),
    INVALID_REQUEST(400, "Invalid request"),

    // --- Token ---
    TOKEN_EXPIRED(401, "Token has expired"),
    TOKEN_INVALID(401, "Token is invalid"),
    ;

    private final int statusCode;
    private final String message;

    ErrorCode(int statusCode, String message) {
        this.statusCode = statusCode;
        this.message = message;
    }
}
