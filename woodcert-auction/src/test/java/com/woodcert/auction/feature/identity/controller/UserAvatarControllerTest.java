package com.woodcert.auction.feature.identity.controller;

import com.woodcert.auction.core.dto.ApiResponse;
import com.woodcert.auction.feature.identity.dto.response.UserProfileRes;
import com.woodcert.auction.feature.identity.service.UserAvatarService;
import com.woodcert.auction.feature.media.dto.request.ConfirmMediaUploadReq;
import com.woodcert.auction.feature.media.dto.request.CreateMediaUploadIntentReq;
import com.woodcert.auction.feature.media.dto.response.MediaUploadIntentRes;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserAvatarControllerTest {

    @Mock
    private UserAvatarService userAvatarService;

    @InjectMocks
    private UserAvatarController userAvatarController;

    @Test
    @DisplayName("createUploadIntent keeps avatar endpoint contract")
    void createUploadIntent_returnsCreatedContract() {
        CreateMediaUploadIntentReq request = new CreateMediaUploadIntentReq("avatar.jpg", "image/jpeg", 1024L);
        MediaUploadIntentRes response = new MediaUploadIntentRes(
                101L,
                "https://api.cloudinary.com/v1_1/demo/image/upload",
                "demo",
                "api-key",
                "woodcert/dev/users/user-1/avatar",
                "woodcert/dev/users/user-1/avatar/101",
                "image",
                1775700000L,
                "signed");

        when(userAvatarService.createCurrentUserAvatarUploadIntent("user-1", request)).thenReturn(response);

        ResponseEntity<ApiResponse<MediaUploadIntentRes>> result =
                userAvatarController.createUploadIntent("user-1", request);

        assertEquals(201, result.getStatusCode().value());
        assertEquals("Avatar upload intent created successfully", result.getBody().message());
        assertEquals(101L, result.getBody().data().mediaId());
    }

    @Test
    @DisplayName("attachAvatar keeps avatar success contract")
    void attachAvatar_returnsSuccessContract() {
        ConfirmMediaUploadReq request = new ConfirmMediaUploadReq(101L, "asset-101");
        UserProfileRes profile = new UserProfileRes(
                "user-1",
                "user@example.com",
                "User One",
                "0911222333",
                "https://res.cloudinary.com/avatar",
                "ACTIVE",
                List.of("ROLE_BIDDER"),
                Instant.parse("2026-03-28T10:00:00Z"),
                false,
                List.of());

        when(userAvatarService.attachCurrentUserAvatar("user-1", request)).thenReturn(profile);

        ResponseEntity<ApiResponse<UserProfileRes>> result =
                userAvatarController.attachAvatar("user-1", request);

        assertEquals(200, result.getStatusCode().value());
        assertEquals("Avatar updated successfully", result.getBody().message());
        assertEquals("https://res.cloudinary.com/avatar", result.getBody().data().avatarUrl());
    }

    @Test
    @DisplayName("deleteAvatar keeps avatar removal contract")
    void deleteAvatar_returnsSuccessContract() {
        UserProfileRes profile = new UserProfileRes(
                "user-1",
                "user@example.com",
                "User One",
                "0911222333",
                null,
                "ACTIVE",
                List.of("ROLE_BIDDER"),
                Instant.parse("2026-03-28T10:00:00Z"),
                false,
                List.of());

        when(userAvatarService.clearCurrentUserAvatar("user-1")).thenReturn(profile);

        ResponseEntity<ApiResponse<UserProfileRes>> result =
                userAvatarController.deleteAvatar("user-1");

        assertEquals(200, result.getStatusCode().value());
        assertEquals("Avatar removed successfully", result.getBody().message());
        assertNullAvatar(result.getBody().data());
    }

    private void assertNullAvatar(UserProfileRes profile) {
        assertNull(profile.avatarUrl());
    }
}
