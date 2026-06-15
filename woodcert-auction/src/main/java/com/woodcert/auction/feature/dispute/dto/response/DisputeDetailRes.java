package com.woodcert.auction.feature.dispute.dto.response;

import java.util.List;

public record DisputeDetailRes(
        DisputeRes dispute,
        List<DisputeMessageRes> messages
) {
}
