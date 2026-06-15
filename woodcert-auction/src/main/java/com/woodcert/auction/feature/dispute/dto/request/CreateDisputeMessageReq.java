package com.woodcert.auction.feature.dispute.dto.request;

import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateDisputeMessageReq(
        @Size(max = 2000, message = "Dispute message must not exceed 2000 characters")
        String content,

        @Size(max = 10, message = "Dispute message evidence must not exceed 10 files")
        List<Long> evidenceMediaIds
) {
}
