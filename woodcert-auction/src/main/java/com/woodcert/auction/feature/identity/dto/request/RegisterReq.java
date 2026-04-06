package com.woodcert.auction.feature.identity.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Registration request DTO.
 */
public record RegisterReq(

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        @Size(max = 255, message = "Email must not exceed 255 characters")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters")
        @Pattern(
                regexp = IdentityRequestPatterns.PASSWORD,
                message = "Password must contain at least one letter, one digit, and no spaces"
        )
        String password,

        @NotBlank(message = "Full name is required")
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
        String phoneNumber
) {
}
