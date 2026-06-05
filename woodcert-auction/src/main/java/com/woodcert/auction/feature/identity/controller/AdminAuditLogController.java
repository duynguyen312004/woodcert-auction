package com.woodcert.auction.feature.identity.controller;

import com.woodcert.auction.core.dto.ApiResponse;
import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.feature.identity.dto.response.AdminAuditLogRes;
import com.woodcert.auction.feature.identity.service.AdminAuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/admin/audit-logs")
@RequiredArgsConstructor
public class AdminAuditLogController {

    private final AdminAuditLogService adminAuditLogService;

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN_ACCESS')")
    public ResponseEntity<ApiResponse<PaginationResponse<AdminAuditLogRes>>> getLogs(
            @RequestParam(required = false) String actorId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String targetType,
            @RequestParam(required = false) String targetId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                adminAuditLogService.getLogs(actorId, action, targetType, targetId, from, to, page, size),
                "Fetch admin audit logs successful"));
    }
}
