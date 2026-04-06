package com.woodcert.auction.feature.identity.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.AssertTrue;

/**
 * Update current user profile request.
 */
public record UpdateUserProfileReq(

        @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
        @Pattern(
                regexp = IdentityRequestPatterns.HUMAN_NAME,
                message = "Full name contains invalid characters"
        )
        String fullName,

        @Size(max = 20, message = "Phone number must not exceed 20 characters")
        @Pattern(
                regexp = IdentityRequestPatterns.VIETNAMESE_PHONE_OR_BLANK,
                message = "Phone number must be a valid Vietnamese phone number"
        )
        String phoneNumber,

        @Size(max = 500, message = "Avatar URL must not exceed 500 characters")
        @Pattern(
                regexp = IdentityRequestPatterns.HTTP_URL_OR_BLANK,
                message = "Avatar URL must be a valid http or https URL"
        )
        String avatarUrl
) {
    @AssertTrue(message = "At least one field must be provided")
    public boolean isAtLeastOneFieldProvided() {
        return fullName != null || phoneNumber != null || avatarUrl != null;
    }
}
