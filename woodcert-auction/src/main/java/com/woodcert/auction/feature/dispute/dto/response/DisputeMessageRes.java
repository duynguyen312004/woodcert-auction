package com.woodcert.auction.feature.dispute.dto.response;

import com.woodcert.auction.feature.dispute.entity.DisputeAuthorRole;
import com.woodcert.auction.feature.dispute.entity.DisputeMessage;

import java.time.Instant;
import java.util.List;

public record DisputeMessageRes(
        Long id,
        DisputeAuthorRole authorRole,
        String content,
        Instant createdAt,
        List<DisputeEvidenceRes> evidence
) {
    public static DisputeMessageRes fromEntity(
            DisputeMessage message,
            List<DisputeEvidenceRes> evidence) {
        return new DisputeMessageRes(
                message.getId(),
                message.getAuthorRole(),
                message.getContent(),
                message.getCreatedAt(),
                evidence
        );
    }
}
