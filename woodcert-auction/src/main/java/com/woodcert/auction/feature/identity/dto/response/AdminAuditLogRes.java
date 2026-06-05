package com.woodcert.auction.feature.identity.dto.response;

import com.woodcert.auction.feature.identity.entity.AdminAction;
import com.woodcert.auction.feature.identity.entity.AdminAuditLog;
import com.woodcert.auction.feature.identity.entity.AdminTargetType;

import java.time.Instant;

public record AdminAuditLogRes(
        Long id,
        String actorAdminId,
        AdminAction action,
        AdminTargetType targetType,
        String targetId,
        String reason,
        String metadata,
        Instant createdAt
) {
    public static AdminAuditLogRes fromEntity(AdminAuditLog log) {
        return new AdminAuditLogRes(
                log.getId(),
                log.getActorAdminId(),
                log.getAction(),
                log.getTargetType(),
                log.getTargetId(),
                log.getReason(),
                log.getMetadata(),
                log.getCreatedAt()
        );
    }
}
