package com.woodcert.auction.feature.media.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.feature.identity.dto.response.UserProfileRes;
import com.woodcert.auction.feature.identity.entity.Role;
import com.woodcert.auction.feature.identity.entity.User;
import com.woodcert.auction.feature.identity.entity.UserStatus;
import com.woodcert.auction.feature.identity.repository.SellerProfileRepository;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import com.woodcert.auction.feature.media.config.CloudinaryProperties;
import com.woodcert.auction.feature.media.dto.request.ConfirmMediaUploadReq;
import com.woodcert.auction.feature.media.dto.request.CreateMediaUploadIntentReq;
import com.woodcert.auction.feature.media.dto.response.MediaUploadIntentRes;
import com.woodcert.auction.feature.media.entity.MediaAsset;
import com.woodcert.auction.feature.media.entity.MediaResourceType;
import com.woodcert.auction.feature.media.entity.MediaUsageType;
import com.woodcert.auction.feature.media.support.MediaUploadContext;
import com.woodcert.auction.feature.media.util.MediaUrlBuilder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AvatarMediaServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private SellerProfileRepository sellerProfileRepository;

    @Mock
    private MediaAssetService mediaAssetService;

    @Mock
    private MediaUrlBuilder mediaUrlBuilder;

    private CloudinaryProperties properties;
    private AvatarMediaService avatarMediaService;

    @BeforeEach
    void setUp() {
        properties = new CloudinaryProperties();
        properties.setBaseFolder("woodcert/dev");
        properties.getUpload().setAvatarMaxBytes(5_242_880);
        avatarMediaService = new AvatarMediaService(
                userRepository,
                sellerProfileRepository,
                properties,
                mediaAssetService,
                mediaUrlBuilder);
    }

    @Test
    @DisplayName("createCurrentUserAvatarUploadIntent throws when user does not exist")
    void createCurrentUserAvatarUploadIntent_userMissing_throws() {
        when(userRepository.existsById("user-1")).thenReturn(false);

        AppException exception = assertThrows(
                AppException.class,
                () -> avatarMediaService.createCurrentUserAvatarUploadIntent(
                        "user-1",
                        new CreateMediaUploadIntentReq("avatar.jpg", "image/jpeg", 1024L)));

        assertEquals("User not found", exception.getMessage());
    }

    @Test
    @DisplayName("createCurrentUserAvatarUploadIntent delegates avatar context to media asset service")
    void createCurrentUserAvatarUploadIntent_success() {
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
        CreateMediaUploadIntentReq request = new CreateMediaUploadIntentReq("avatar.jpg", "image/jpeg", 1024L);

        when(userRepository.existsById("user-1")).thenReturn(true);
        when(mediaAssetService.createUploadIntent(
                eq(new MediaUploadContext(
                        "user-1",
                        MediaUsageType.USER_AVATAR,
                        MediaResourceType.IMAGE,
                        "woodcert/dev/users/user-1/avatar",
                        properties.getUpload().getAvatarMaxBytes(),
                        "image/")),
                eq(request))).thenReturn(response);

        MediaUploadIntentRes result = avatarMediaService.createCurrentUserAvatarUploadIntent("user-1", request);

        assertEquals(101L, result.mediaId());
    }

    @Test
    @DisplayName("attachCurrentUserAvatar replaces old avatar and marks old asset pending delete")
    void attachCurrentUserAvatar_replacesOldAvatar() {
        User user = createUser("user-1");
        MediaAsset oldAvatar = new MediaAsset();
        oldAvatar.setId(1L);
        user.setAvatarMedia(oldAvatar);

        MediaAsset uploadedAvatar = new MediaAsset();
        uploadedAvatar.setId(2L);
        ConfirmMediaUploadReq request = new ConfirmMediaUploadReq(2L, "asset-2");

        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
        when(mediaAssetService.confirmOwnedUpload("user-1", request)).thenReturn(uploadedAvatar);
        when(sellerProfileRepository.existsById("user-1")).thenReturn(false);
        when(userRepository.save(user)).thenReturn(user);
        when(mediaUrlBuilder.buildAvatarUrl(uploadedAvatar)).thenReturn("https://res.cloudinary.com/avatar");

        UserProfileRes result = avatarMediaService.attachCurrentUserAvatar("user-1", request);

        assertEquals("https://res.cloudinary.com/avatar", result.avatarUrl());
        assertEquals(uploadedAvatar, user.getAvatarMedia());
        verify(mediaAssetService).markPendingDelete(oldAvatar);
    }

    @Test
    @DisplayName("clearCurrentUserAvatar removes avatar and marks media pending delete")
    void clearCurrentUserAvatar_success() {
        User user = createUser("user-1");
        MediaAsset currentAvatar = new MediaAsset();
        currentAvatar.setId(1L);
        user.setAvatarMedia(currentAvatar);

        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
        when(sellerProfileRepository.existsById("user-1")).thenReturn(false);
        when(userRepository.save(user)).thenReturn(user);

        UserProfileRes result = avatarMediaService.clearCurrentUserAvatar("user-1");

        assertNull(result.avatarUrl());
        assertNull(user.getAvatarMedia());
        verify(mediaAssetService).markPendingDelete(currentAvatar);
    }

    private User createUser(String userId) {
        Role bidderRole = new Role();
        bidderRole.setId(1);
        bidderRole.setName("ROLE_BIDDER");

        User user = new User();
        user.setId(userId);
        user.setEmail("user@example.com");
        user.setFullName("Original User");
        user.setPhoneNumber("0911222333");
        user.setStatus(UserStatus.ACTIVE);
        user.setRoles(Set.of(bidderRole));
        return user;
    }
}
