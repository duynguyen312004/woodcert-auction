package com.woodcert.auction.feature.dispute.dto.response;

import com.woodcert.auction.feature.dispute.entity.DisputeCase;
import com.woodcert.auction.feature.dispute.entity.DisputeResolutionOutcome;
import com.woodcert.auction.feature.dispute.entity.DisputeStatus;

import java.time.Instant;
import java.util.List;

public record DisputeRes(
        Long id,
        Long orderId,
        Long fulfillmentId,
        String openedByUserId,
        DisputeStatus status,
        String reason,
        String description,
        Instant openedAt,
        Instant resolvedAt,
        String resolvedByAdminId,
        DisputeResolutionOutcome resolutionOutcome,
        String resolutionNote,
        List<DisputeEvidenceRes> evidence
) {
    public static DisputeRes fromEntity(DisputeCase dispute, List<DisputeEvidenceRes> evidence) {
        if (dispute == null) {
            return null;
        }
        return new DisputeRes(
                dispute.getId(),
                dispute.getOrderId(),
                dispute.getFulfillmentId(),
                dispute.getOpenedByUserId(),
                dispute.getStatus(),
                dispute.getReason(),
                dispute.getDescription(),
                dispute.getOpenedAt(),
                dispute.getResolvedAt(),
                dispute.getResolvedByAdminId(),
                dispute.getResolutionOutcome(),
                dispute.getResolutionNote(),
                evidence
        );
    }
}
