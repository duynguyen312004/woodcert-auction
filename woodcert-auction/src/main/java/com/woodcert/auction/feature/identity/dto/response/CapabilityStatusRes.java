package com.woodcert.auction.feature.identity.dto.response;

import com.woodcert.auction.feature.identity.entity.CapabilityStatus;
import com.woodcert.auction.feature.identity.entity.UserCapability;
import com.woodcert.auction.feature.identity.entity.UserCapabilityStatus;

import java.time.Instant;

public record CapabilityStatusRes(
        UserCapability capability,
        CapabilityStatus status,
        String reason,
        String updatedByAdminId,
        Instant updatedAt
) {
    public static CapabilityStatusRes fromEntity(UserCapabilityStatus status) {
        return new CapabilityStatusRes(
                status.getCapability(),
                status.getStatus(),
                status.getReason(),
                status.getUpdatedByAdminId(),
                status.getUpdatedAt()
        );
    }
}
