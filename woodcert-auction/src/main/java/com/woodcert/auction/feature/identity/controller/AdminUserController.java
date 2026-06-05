package com.woodcert.auction.feature.identity.controller;

import com.woodcert.auction.core.auth.CurrentUserId;
import com.woodcert.auction.core.dto.ApiResponse;
import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.feature.identity.dto.request.BanReasonReq;
import com.woodcert.auction.feature.identity.dto.response.AdminUserRes;
import com.woodcert.auction.feature.identity.entity.UserCapability;
import com.woodcert.auction.feature.identity.service.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    @PreAuthorize("hasAuthority('BAN_USER')")
    public ResponseEntity<ApiResponse<PaginationResponse<AdminUserRes>>> getUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                adminUserService.getUsers(role, status, query, page, size),
                "Fetch users successful"));
    }

    @PatchMapping("/{userId}/ban")
    @PreAuthorize("hasAuthority('BAN_USER')")
    public ResponseEntity<ApiResponse<AdminUserRes>> banUser(
            @CurrentUserId String currentUserId,
            @PathVariable String userId,
            @Valid @RequestBody BanReasonReq request) {
        return ResponseEntity.ok(ApiResponse.success(
                adminUserService.banUser(userId, currentUserId, request.normalizedReason()),
                "User banned successfully"));
    }

    @PatchMapping("/{userId}/unban")
    @PreAuthorize("hasAuthority('BAN_USER')")
    public ResponseEntity<ApiResponse<AdminUserRes>> unbanUser(
            @CurrentUserId String currentUserId,
            @PathVariable String userId,
            @Valid @RequestBody BanReasonReq request) {
        return ResponseEntity.ok(ApiResponse.success(
                adminUserService.unbanUser(userId, currentUserId, request.normalizedReason()),
                "User unbanned successfully"));
    }

    @PatchMapping("/{userId}/capabilities/{capability}/ban")
    @PreAuthorize("hasAuthority('BAN_USER')")
    public ResponseEntity<ApiResponse<AdminUserRes>> banCapability(
            @CurrentUserId String currentUserId,
            @PathVariable String userId,
            @PathVariable UserCapability capability,
            @Valid @RequestBody BanReasonReq request) {
        return ResponseEntity.ok(ApiResponse.success(
                adminUserService.banCapability(userId, capability, currentUserId, request.normalizedReason()),
                "User capability banned successfully"));
    }

    @PatchMapping("/{userId}/capabilities/{capability}/unban")
    @PreAuthorize("hasAuthority('BAN_USER')")
    public ResponseEntity<ApiResponse<AdminUserRes>> unbanCapability(
            @CurrentUserId String currentUserId,
            @PathVariable String userId,
            @PathVariable UserCapability capability,
            @Valid @RequestBody BanReasonReq request) {
        return ResponseEntity.ok(ApiResponse.success(
                adminUserService.unbanCapability(userId, capability, currentUserId, request.normalizedReason()),
                "User capability unbanned successfully"));
    }
}
