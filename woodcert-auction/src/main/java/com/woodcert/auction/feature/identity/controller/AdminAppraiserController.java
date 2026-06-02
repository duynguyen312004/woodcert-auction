package com.woodcert.auction.feature.identity.controller;

import com.woodcert.auction.core.dto.ApiResponse;
import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.feature.identity.dto.response.AdminUserRes;
import com.woodcert.auction.feature.identity.service.AdminAppraiserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/appraisers")
@RequiredArgsConstructor
public class AdminAppraiserController {

    private final AdminAppraiserService adminAppraiserService;

    @GetMapping
    @PreAuthorize("hasAuthority('BAN_USER')")
    public ResponseEntity<ApiResponse<PaginationResponse<AdminUserRes>>> getUsers(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                adminAppraiserService.getUsers(query, page, size),
                "Fetch appraiser candidates successful"));
    }

    @PatchMapping("/{userId}/promote")
    @PreAuthorize("hasAuthority('BAN_USER')")
    public ResponseEntity<ApiResponse<AdminUserRes>> promoteAppraiser(@PathVariable String userId) {
        return ResponseEntity.ok(ApiResponse.success(
                adminAppraiserService.promoteAppraiser(userId),
                "Appraiser role granted successfully"));
    }

    @PatchMapping("/{userId}/demote")
    @PreAuthorize("hasAuthority('BAN_USER')")
    public ResponseEntity<ApiResponse<AdminUserRes>> demoteAppraiser(@PathVariable String userId) {
        return ResponseEntity.ok(ApiResponse.success(
                adminAppraiserService.demoteAppraiser(userId),
                "Appraiser role revoked successfully"));
    }
}
