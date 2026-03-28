package com.woodcert.auction.core.exception;

import com.woodcert.auction.core.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * Global exception handler for the entire application.
 * Catches all exceptions and returns standardized ApiResponse.
 *
 * Rules (from PROJECT-RULES Section 9):
 * - NEVER expose stacktrace or SQL query
 * - Validation errors return field map
 * - All responses wrapped in ApiResponse
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handle AppException — all business logic exceptions.
     */
    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Void>> handleAppException(AppException ex) {
        log.warn("AppException: statusCode={}, message={}", ex.getStatusCode(), ex.getMessage());

        return ResponseEntity
                .status(ex.getStatusCode())
                .body(ApiResponse.error(ex.getStatusCode(), ex.getMessage()));
    }

    /**
     * Handle validation errors from @Valid.
     * Returns a map of field → error message.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationException(
            MethodArgumentNotValidException ex) {

        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }

        log.warn("Validation failed: {}", fieldErrors);

        return ResponseEntity
                .badRequest()
                .body(ApiResponse.error(400, "Validation failed", fieldErrors));
    }

    /**
     * Handle Spring Security AccessDeniedException.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDeniedException(AccessDeniedException ex) {
        log.warn("Access denied: {}", ex.getMessage());

        return ResponseEntity
                .status(403)
                .body(ApiResponse.error(403, "Access denied"));
    }

    /**
     * Catch-all handler for unexpected exceptions.
     * NEVER expose internal details (stacktrace, SQL).
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUncaughtException(Exception ex) {
        log.error("Uncaught exception: ", ex);

        return ResponseEntity
                .internalServerError()
                .body(ApiResponse.error(500, "Internal Server Error"));
    }
}
