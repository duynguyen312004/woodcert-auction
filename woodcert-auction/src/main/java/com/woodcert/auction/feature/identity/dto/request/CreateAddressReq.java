package com.woodcert.auction.feature.identity.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Create address request.
 */
public record CreateAddressReq(

        @NotBlank(message = "Receiver name is required")
        @Size(min = 2, max = 100, message = "Receiver name must be between 2 and 100 characters")
        @Pattern(
                regexp = IdentityRequestPatterns.HUMAN_NAME,
                message = "Receiver name contains invalid characters"
        )
        String receiverName,

        @NotBlank(message = "Phone number is required")
        @Size(max = 20, message = "Phone number must not exceed 20 characters")
        @Pattern(
                regexp = IdentityRequestPatterns.VIETNAMESE_PHONE,
                message = "Phone number must be a valid Vietnamese phone number"
        )
        String phoneNumber,

        @NotBlank(message = "Street address is required")
        @Size(min = 5, max = 255, message = "Street address must be between 5 and 255 characters")
        @Pattern(
                regexp = IdentityRequestPatterns.STREET_ADDRESS,
                message = "Street address contains invalid characters"
        )
        String streetAddress,

        @NotBlank(message = "Province code is required")
        @Size(max = 2, message = "Province code must not exceed 2 digits")
        @Pattern(
                regexp = IdentityRequestPatterns.PROVINCE_CODE,
                message = "Province code must contain 1 to 2 digits"
        )
        String provinceCode,

        @NotBlank(message = "District code is required")
        @Size(max = 3, message = "District code must not exceed 3 digits")
        @Pattern(
                regexp = IdentityRequestPatterns.DISTRICT_CODE,
                message = "District code must contain 1 to 3 digits"
        )
        String districtCode,

        @NotBlank(message = "Ward code is required")
        @Size(max = 5, message = "Ward code must not exceed 5 digits")
        @Pattern(
                regexp = IdentityRequestPatterns.WARD_CODE,
                message = "Ward code must contain 1 to 5 digits"
        )
        String wardCode,

        boolean isDefault
) {
}
