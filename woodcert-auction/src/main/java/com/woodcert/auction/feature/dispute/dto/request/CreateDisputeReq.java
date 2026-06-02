package com.woodcert.auction.feature.dispute.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateDisputeReq(
        @NotBlank(message = "Dispute reason is required")
        @Size(max = 120, message = "Dispute reason must not exceed 120 characters")
        String reason,

        @Size(max = 2000, message = "Dispute description must not exceed 2000 characters")
        String description,

        @Size(max = 10, message = "Dispute evidence must not exceed 10 files")
        List<Long> evidenceMediaIds
) {
}
