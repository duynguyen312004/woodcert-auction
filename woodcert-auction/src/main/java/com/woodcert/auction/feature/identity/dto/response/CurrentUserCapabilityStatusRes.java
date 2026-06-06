package com.woodcert.auction.feature.identity.dto.response;

import com.woodcert.auction.feature.identity.entity.CapabilityStatus;
import com.woodcert.auction.feature.identity.entity.UserCapability;
import com.woodcert.auction.feature.identity.entity.UserCapabilityStatus;

import java.time.Instant;

/**
 * Capability status exposed to the current user without internal admin identifiers.
 */
public record CurrentUserCapabilityStatusRes(
        UserCapability capability,
        CapabilityStatus status,
        String reason,
        Instant updatedAt
) {
    public static CurrentUserCapabilityStatusRes fromEntity(UserCapabilityStatus status) {
        return new CurrentUserCapabilityStatusRes(
                status.getCapability(),
                status.getStatus(),
                status.getReason(),
                status.getUpdatedAt()
        );
    }
}
