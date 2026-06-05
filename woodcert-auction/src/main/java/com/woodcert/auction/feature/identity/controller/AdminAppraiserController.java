package com.woodcert.auction.feature.identity.controller;

import com.woodcert.auction.core.dto.ApiResponse;
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
            @Valid @RequestBody CreateAdminAppraiserReq request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(
                adminAppraiserService.createAppraiser(request),
                "Appraiser account created successfully"));
    }



    @PatchMapping("/{userId}/demote")
    @PreAuthorize("hasAuthority('MANAGE_APPRAISERS')")
    public ResponseEntity<ApiResponse<AdminUserRes>> demoteAppraiser(@PathVariable String userId) {
        return ResponseEntity.ok(ApiResponse.success(
                adminAppraiserService.demoteAppraiser(userId),
                "Appraiser role revoked successfully"));
    }
}
