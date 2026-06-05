package com.woodcert.auction.feature.finance.controller;

import com.woodcert.auction.core.auth.CurrentUserId;
import com.woodcert.auction.core.dto.ApiResponse;
import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.feature.finance.dto.response.PlatformRevenueStatsRes;
import com.woodcert.auction.feature.finance.dto.response.PlatformRevenueTransactionRes;
import com.woodcert.auction.feature.finance.entity.PlatformRevenueType;
import com.woodcert.auction.feature.finance.service.PlatformRevenueService;
import com.woodcert.auction.feature.identity.entity.AdminAction;
import com.woodcert.auction.feature.identity.entity.AdminTargetType;
import com.woodcert.auction.feature.identity.service.AdminAuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/revenue")
@RequiredArgsConstructor
public class PlatformRevenueController {

    private final PlatformRevenueService platformRevenueService;
    private final AdminAuditLogService adminAuditLogService;

    @GetMapping
    @PreAuthorize("hasAuthority('VIEW_PLATFORM_REVENUE')")
    public ResponseEntity<ApiResponse<PaginationResponse<PlatformRevenueTransactionRes>>> getTransactions(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) PlatformRevenueType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(ApiResponse.success(
                platformRevenueService.getTransactions(page, size, type, from, to, q),
                "Fetch platform revenue transactions successful"));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('VIEW_PLATFORM_REVENUE')")
    public ResponseEntity<ApiResponse<PlatformRevenueStatsRes>> getStats(
            @RequestParam(required = false) PlatformRevenueType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(ApiResponse.success(
                platformRevenueService.getStats(type, from, to, q),
                "Fetch platform revenue stats successful"));
    }

    @GetMapping("/export")
    @PreAuthorize("hasAuthority('VIEW_PLATFORM_REVENUE')")
    public ResponseEntity<StreamingResponseBody> exportTransactions(
            @CurrentUserId String adminId,
            @RequestParam(required = false) PlatformRevenueType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(required = false) String q) {
        adminAuditLogService.log(
                adminId,
                AdminAction.REVENUE_EXPORTED,
                AdminTargetType.REVENUE,
                "platform-revenue",
                null,
                exportMetadata(type, from, to, q));

        String filename = "platform-revenue-" + DateTimeFormatter.ISO_INSTANT.format(Instant.now())
                .replace(":", "-") + ".csv";
        StreamingResponseBody body = outputStream ->
                platformRevenueService.writeTransactionsCsv(outputStream, type, from, to, q);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(new MediaType("text", "csv"))
                .body(body);
    }

    private Map<String, Object> exportMetadata(PlatformRevenueType type, Instant from, Instant to, String q) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        if (type != null) {
            metadata.put("type", type.name());
        }
        if (from != null) {
            metadata.put("from", from.toString());
        }
        if (to != null) {
            metadata.put("to", to.toString());
        }
        if (q != null && !q.isBlank()) {
            metadata.put("query", q.trim());
        }
        return metadata;
    }
}
