package com.woodcert.auction.core.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;

/**
 * Standard wrapper for API responses.
 * Every REST endpoint should return ResponseEntity<ApiResponse<T>>.
 *
 * The optional {@code errorCode} field carries the machine-readable
 * {@link com.woodcert.auction.core.exception.ErrorCode} enum name so clients
 * can branch on a stable identifier instead of the human-readable message.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
        int statusCode,
        String message,
        T data,
        String errorCode,
        Instant timestamp) {

    private static Instant now() {
        return Instant.now();
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(200, "Success", data, null, now());
    }

    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(200, message, data, null, now());
    }

    public static <T> ApiResponse<T> created(T data) {
        return new ApiResponse<>(201, "Created", data, null, now());
    }

    public static <T> ApiResponse<T> created(T data, String message) {
        return new ApiResponse<>(201, message, data, null, now());
    }

    public static <T> ApiResponse<T> error(int statusCode, String message) {
        return new ApiResponse<>(statusCode, message, null, null, now());
    }

    public static <T> ApiResponse<T> error(int statusCode, String message, T data) {
        return new ApiResponse<>(statusCode, message, data, null, now());
    }

    public static <T> ApiResponse<T> error(int statusCode, String message, String errorCode) {
        return new ApiResponse<>(statusCode, message, null, errorCode, now());
    }
}
