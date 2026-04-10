package com.woodcert.auction.feature.media.controller;

import com.woodcert.auction.core.auth.CurrentUserId;
import com.woodcert.auction.core.dto.ApiResponse;
import com.woodcert.auction.feature.identity.dto.response.UserProfileRes;
import com.woodcert.auction.feature.media.dto.request.ConfirmMediaUploadReq;
import com.woodcert.auction.feature.media.dto.request.CreateMediaUploadIntentReq;
import com.woodcert.auction.feature.media.dto.response.MediaUploadIntentRes;
import com.woodcert.auction.feature.media.service.AvatarMediaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users/me/avatar")
@RequiredArgsConstructor
public class UserAvatarController {

    private final AvatarMediaService avatarMediaService;

    @PostMapping("/upload-intent")
    public ResponseEntity<ApiResponse<MediaUploadIntentRes>> createUploadIntent(
            @CurrentUserId String userId,
            @RequestBody @Valid CreateMediaUploadIntentReq request) {
        MediaUploadIntentRes response = avatarMediaService.createCurrentUserAvatarUploadIntent(userId, request);
        return ResponseEntity.status(201).body(ApiResponse.created(response, "Avatar upload intent created successfully"));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<UserProfileRes>> attachAvatar(
            @CurrentUserId String userId,
            @RequestBody @Valid ConfirmMediaUploadReq request) {
        UserProfileRes profile = avatarMediaService.attachCurrentUserAvatar(userId, request);
        return ResponseEntity.ok(ApiResponse.success(profile, "Avatar updated successfully"));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<UserProfileRes>> deleteAvatar(
            @CurrentUserId String userId) {
        UserProfileRes profile = avatarMediaService.clearCurrentUserAvatar(userId);
        return ResponseEntity.ok(ApiResponse.success(profile, "Avatar removed successfully"));
    }
}
