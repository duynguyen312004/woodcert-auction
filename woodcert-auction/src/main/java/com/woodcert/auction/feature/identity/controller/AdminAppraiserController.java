package com.woodcert.auction.feature.identity.controller;

import com.woodcert.auction.core.auth.CurrentUserId;
import com.woodcert.auction.core.dto.ApiResponse;
import com.woodcert.auction.feature.identity.dto.request.BanReasonReq;
import com.woodcert.auction.feature.identity.dto.request.CreateAdminAppraiserReq;
import com.woodcert.auction.feature.identity.dto.response.AdminUserRes;
import com.woodcert.auction.feature.identity.service.AdminAppraiserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/appraisers")
@RequiredArgsConstructor
public class AdminAppraiserController {

    private final AdminAppraiserService adminAppraiserService;

    @PostMapping
    @PreAuthorize("hasAuthority('MANAGE_APPRAISERS')")
    public ResponseEntity<ApiResponse<AdminUserRes>> createAppraiser(
            @CurrentUserId String adminId,
            @Valid @RequestBody CreateAdminAppraiserReq request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(
                adminAppraiserService.createAppraiser(adminId, request),
                "Appraiser account created successfully"));
    }

    @PatchMapping("/{userId}/ban")
    @PreAuthorize("hasAuthority('MANAGE_APPRAISERS')")
    public ResponseEntity<ApiResponse<AdminUserRes>> banAppraiser(
            @CurrentUserId String adminId,
            @PathVariable String userId,
            @Valid @RequestBody BanReasonReq request) {
        return ResponseEntity.ok(ApiResponse.success(
                adminAppraiserService.banAppraiser(adminId, userId, request.normalizedReason()),
                "Appraiser capability banned successfully"));
    }

    @PatchMapping("/{userId}/unban")
    @PreAuthorize("hasAuthority('MANAGE_APPRAISERS')")
    public ResponseEntity<ApiResponse<AdminUserRes>> unbanAppraiser(
            @CurrentUserId String adminId,
            @PathVariable String userId,
            @Valid @RequestBody BanReasonReq request) {
        return ResponseEntity.ok(ApiResponse.success(
                adminAppraiserService.unbanAppraiser(adminId, userId, request.normalizedReason()),
                "Appraiser capability unbanned successfully"));
    }
}
