package com.woodcert.auction.feature.identity.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateSellerProfileReq(
        @NotBlank(message = "Store name is required")
        @Size(min = 2, max = 100, message = "Store name must be between 2 and 100 characters")
        @Pattern(
                regexp = IdentityRequestPatterns.STORE_NAME,
                message = "Store name contains invalid characters"
        )
        String storeName
) {
}
