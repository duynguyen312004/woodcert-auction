package com.woodcert.auction.feature.identity.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.identity.dto.response.AdminAuditLogRes;
import com.woodcert.auction.feature.identity.entity.AdminAction;
import com.woodcert.auction.feature.identity.entity.AdminAuditLog;
import com.woodcert.auction.feature.identity.entity.AdminTargetType;
import com.woodcert.auction.feature.identity.repository.AdminAuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminAuditLogServiceImpl implements AdminAuditLogService {

    private final AdminAuditLogRepository adminAuditLogRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public void log(
            String actorAdminId,
            AdminAction action,
            AdminTargetType targetType,
            String targetId,
            String reason,
            Map<String, ?> metadata) {
        AdminAuditLog log = new AdminAuditLog();
        log.setActorAdminId(actorAdminId);
        log.setAction(action);
        log.setTargetType(targetType);
        log.setTargetId(targetId);
        log.setReason(trimToNull(reason));
        log.setMetadata(serializeMetadata(metadata));
        adminAuditLogRepository.save(log);
    }

    @Override
    @Transactional(readOnly = true)
    public PaginationResponse<AdminAuditLogRes> getLogs(
            String actorId,
            String action,
            String targetType,
            String targetId,
            Instant from,
            Instant to,
            int page,
            int size) {
        var pageable = PageRequest.of(Math.max(0, page - 1), Math.min(Math.max(size, 1), 100));
        return PaginationResponse.of(adminAuditLogRepository.search(
                trimToNull(actorId),
                parseEnum(action, AdminAction.class, "Invalid admin action"),
                parseEnum(targetType, AdminTargetType.class, "Invalid audit target type"),
                trimToNull(targetId),
                from,
                to,
                pageable
        ).map(AdminAuditLogRes::fromEntity));
    }

    private String serializeMetadata(Map<String, ?> metadata) {
        if (metadata == null || metadata.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(metadata);
        } catch (JsonProcessingException ex) {
            throw new AppException(ErrorCode.UNCATEGORIZED, "Failed to serialize audit metadata");
        }
    }

    private <T extends Enum<T>> T parseEnum(String value, Class<T> type, String message) {
        String normalized = trimToNull(value);
        if (normalized == null) {
            return null;
        }
        try {
            return Enum.valueOf(type, normalized.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new AppException(ErrorCode.INVALID_REQUEST, message);
        }
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
