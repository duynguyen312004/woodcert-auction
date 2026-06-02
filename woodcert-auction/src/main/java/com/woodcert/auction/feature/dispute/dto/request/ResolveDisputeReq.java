package com.woodcert.auction.feature.dispute.dto.request;

import com.woodcert.auction.feature.dispute.entity.DisputeResolutionOutcome;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ResolveDisputeReq(
        @NotNull(message = "Resolution outcome is required")
        DisputeResolutionOutcome outcome,

        @Size(max = 2000, message = "Resolution note must not exceed 2000 characters")
        String resolutionNote
) {
}
