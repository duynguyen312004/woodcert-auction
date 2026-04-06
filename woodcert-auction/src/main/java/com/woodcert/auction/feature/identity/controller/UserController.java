package com.woodcert.auction.feature.identity.controller;

import com.woodcert.auction.core.auth.CurrentUserId;
import com.woodcert.auction.core.dto.ApiResponse;
import com.woodcert.auction.feature.identity.dto.request.PatchUserProfileReq;
import com.woodcert.auction.feature.identity.dto.request.UpdateUserProfileReq;
import com.woodcert.auction.feature.identity.dto.response.UserProfileRes;
import com.woodcert.auction.feature.identity.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users/me")
@RequiredArgsConstructor
public class UserController {

    private final UserProfileService userProfileService;

    @GetMapping
    public ResponseEntity<ApiResponse<UserProfileRes>> getCurrentUser(
            @CurrentUserId String userId) {
        UserProfileRes userProfile = userProfileService.getCurrentUserProfile(userId);
        return ResponseEntity.ok(ApiResponse.success(userProfile, "Fetch user profile successful"));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<UserProfileRes>> updateCurrentUser(
            @CurrentUserId String userId,
            @RequestBody @Valid UpdateUserProfileReq request) {
        UserProfileRes userProfile = userProfileService.updateCurrentUserProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.success(userProfile, "User profile updated successfully"));
    }

    @PatchMapping
    public ResponseEntity<ApiResponse<UserProfileRes>> patchCurrentUser(
            @CurrentUserId String userId,
            @RequestBody PatchUserProfileReq request) {
        UserProfileRes userProfile = userProfileService.patchCurrentUserProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.success(userProfile, "User profile patched successfully"));
    }
}
