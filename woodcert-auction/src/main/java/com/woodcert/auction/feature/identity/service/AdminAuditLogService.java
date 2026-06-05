package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.feature.identity.dto.response.AdminAuditLogRes;
import com.woodcert.auction.feature.identity.entity.AdminAction;
import com.woodcert.auction.feature.identity.entity.AdminTargetType;

import java.time.Instant;
import java.util.Map;

public interface AdminAuditLogService {

    void log(
            String actorAdminId,
            AdminAction action,
            AdminTargetType targetType,
            String targetId,
            String reason,
            Map<String, ?> metadata);

    PaginationResponse<AdminAuditLogRes> getLogs(
            String actorId,
            String action,
            String targetType,
            String targetId,
            Instant from,
            Instant to,
            int page,
            int size);
}
