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
    PASSWORD_RESET_TOKEN_INVALID(400, "Password reset token is invalid or has already been used"),
    PASSWORD_RESET_TOKEN_EXPIRED(400, "Password reset token has expired"),

    // --- Resource ---
    RESOURCE_NOT_FOUND(404, "Resource not found"),
    DUPLICATE_RESOURCE(409, "Resource already exists"),
    INVALID_REQUEST(400, "Invalid request"),

    // --- Token ---
    TOKEN_EXPIRED(401, "Token has expired"),
    TOKEN_INVALID(401, "Token is invalid"),

    // --- Catalog ---
    CATEGORY_NOT_FOUND(404, "Category not found"),
    PRODUCT_NOT_FOUND(404, "Product not found"),
    PRODUCT_NOT_OWNED(403, "You do not own this product"),
    PRODUCT_NOT_DRAFT(400, "Product must be in DRAFT status"),
    PRODUCT_NOT_PENDING(400, "Product must be in PENDING_APPRAISAL status"),
    PRODUCT_ALREADY_APPRAISED(409, "Product has already been appraised"),
    APPRAISAL_CLAIM_CONFLICT(409, "Product is already claimed by another appraiser"),
    APPRAISAL_CLAIM_REQUIRED(403, "You must claim this product before submitting appraisal"),
    INVALID_PRIMARY_IMAGE(400, "Exactly one primary image is required"),
    DUPLICATE_MEDIA_ID(400, "Duplicate media asset references are not allowed"),
    DUPLICATE_SORT_ORDER(400, "Duplicate sort order values are not allowed"),
    MEDIA_USAGE_TYPE_MISMATCH(400, "Media asset usage type does not match expected type"),
    REJECTION_NOTES_REQUIRED(400, "Appraiser notes are required when rejecting a product"),

    // --- Auction ---
    AUCTION_SESSION_NOT_FOUND(404, "Auction session not found"),
    AUCTION_NOT_ACTIVE(400, "Auction session is not currently active"),
    AUCTION_ALREADY_REGISTERED(409, "You have already registered for this auction"),
    AUCTION_SESSION_NOT_REGISTRABLE(400, "Auction session is not open for registration"),
    AUCTION_BIDDER_NOT_REGISTERED(403, "You must register and have a frozen deposit to place a bid"),
    AUCTION_SELF_BIDDING_NOT_ALLOWED(403, "Seller cannot register or bid in their own auction"),
    BID_AMOUNT_TOO_LOW(400, "Bid amount must be at least current price plus step price"),
    BID_AUCTION_ENDED(400, "Auction session has already ended"),
    AUCTION_SESSION_NOT_OWNED(403, "You do not own this auction session"),
    AUCTION_PRODUCT_NOT_APPRAISED(400, "Product must be APPRAISED to create an auction session"),
    AUCTION_PRODUCT_NOT_AVAILABLE(409, "Product is not available for auction"),
    AUCTION_PRODUCT_NOT_OWNED(403, "You do not own this product"),
    AUCTION_SESSION_CONFLICT(409, "Product already has an active or waiting auction session"),
    AUCTION_SESSION_NOT_CANCELABLE(400, "Auction session can only be canceled when in WAITING status"),
    AUCTION_INVALID_TIME_RANGE(400, "Auction duration must be between 1 hour and 30 days"),
    AUCTION_START_TIME_TOO_SOON(400, "Auction start time must be at least 5 minutes in the future"),
    AUCTION_STEP_PRICE_TOO_LOW(400, "Step price must be at least 100,000 VND"),
    AUCTION_DEPOSIT_AMOUNT_INVALID(400, "Deposit amount must be between 1,000,000 VND and 50% of starting price"),
    AUCTION_RESERVE_PRICE_INVALID(400, "Reserve price must be greater than or equal to starting price"),

    // --- Finance ---
    WALLET_AMOUNT_INVALID(400, "Wallet amount must be greater than 0"),
    WALLET_INSUFFICIENT_AVAILABLE_BALANCE(400, "Insufficient available balance"),
    WALLET_INSUFFICIENT_FROZEN_BALANCE(400, "Insufficient frozen balance"),
    WALLET_OPERATION_KEY_INVALID(400, "Wallet operation key is required"),
    WALLET_OPERATION_PAYLOAD_MISMATCH(409, "Operation key was already used with a different wallet mutation payload"),
    WALLET_OPERATION_IN_PROGRESS(409, "Wallet operation is already in progress, please retry later"),
    WALLET_OPERATION_ALREADY_FAILED(409, "Wallet operation already failed and cannot be retried with the same operation key"),
    WALLET_CONCURRENT_MODIFICATION(409, "Wallet was updated concurrently, please retry"),
    WALLET_REFERENCE_INVALID(400, "Wallet reference is invalid for this mutation source"),
    ;

    private final int statusCode;
    private final String message;

    ErrorCode(int statusCode, String message) {
        this.statusCode = statusCode;
        this.message = message;
    }
}
