package com.woodcert.auction.feature.identity.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Create seller profile request.
 */
public record CreateSellerProfileReq(

        @NotBlank(message = "Store name is required")
        @Size(min = 2, max = 100, message = "Store name must be between 2 and 100 characters")
        @Pattern(
                regexp = IdentityRequestPatterns.STORE_NAME,
                message = "Store name contains invalid characters"
        )
        String storeName,

        @NotBlank(message = "Identity card number is required")
        @Pattern(
                regexp = IdentityRequestPatterns.IDENTITY_CARD_NUMBER,
                message = "Identity card number must contain exactly 9 or 12 digits"
        )
        String identityCardNumber,

        @Size(max = 50, message = "Tax code must not exceed 50 characters")
        @Pattern(
                regexp = IdentityRequestPatterns.TAX_CODE_OR_BLANK,
                message = "Tax code must be a valid 10-digit or branch tax code"
        )
        String taxCode
) {
}
