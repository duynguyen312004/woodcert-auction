package com.woodcert.auction.core.exception;

import lombok.Getter;

/**
 * Application-wide custom exception.
 * All business exceptions in the system MUST extend or use this class.
 * Caught by GlobalExceptionHandler and returned as ApiResponse.
 */
@Getter
public class AppException extends RuntimeException {

    private final int statusCode;

    /**
     * Create exception with explicit statusCode and message.
     */
    public AppException(int statusCode, String message) {
        super(message);
        this.statusCode = statusCode;
    }

    /**
     * Create exception from an ErrorCode enum value.
     * Preferred constructor for consistency.
     */
    public AppException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.statusCode = errorCode.getStatusCode();
    }

    /**
     * Create exception from an ErrorCode with a custom message override.
     */
    public AppException(ErrorCode errorCode, String message) {
        super(message);
        this.statusCode = errorCode.getStatusCode();
    }
}
