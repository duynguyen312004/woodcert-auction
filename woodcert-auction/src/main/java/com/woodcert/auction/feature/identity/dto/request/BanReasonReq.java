package com.woodcert.auction.feature.identity.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BanReasonReq(
        @NotBlank(message = "Reason is required")
        @Size(max = 1000, message = "Reason must not exceed 1000 characters")
        String reason
) {
    public String normalizedReason() {
        return reason.trim();
    }
}
