package com.woodcert.auction.feature.media.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.identity.dto.response.UserProfileRes;
import com.woodcert.auction.feature.identity.entity.User;
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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AvatarMediaService {

    private final UserRepository userRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final CloudinaryProperties properties;
    private final MediaAssetService mediaAssetService;
    private final MediaUrlBuilder mediaUrlBuilder;

    @Transactional
    public MediaUploadIntentRes createCurrentUserAvatarUploadIntent(String userId, CreateMediaUploadIntentReq request) {
        ensureUserExists(userId);
        return mediaAssetService.createUploadIntent(buildAvatarContext(userId), request);
    }

    @Transactional
    public UserProfileRes attachCurrentUserAvatar(String userId, ConfirmMediaUploadReq request) {
        User user = findUser(userId);
        MediaAsset currentAvatar = user.getAvatarMedia();
        MediaAsset uploadedAvatar = mediaAssetService.confirmOwnedUpload(userId, request);

        user.setAvatarMedia(uploadedAvatar);
        if (currentAvatar != null && !currentAvatar.getId().equals(uploadedAvatar.getId())) {
            mediaAssetService.markPendingDelete(currentAvatar);
        }

        boolean hasSellerProfile = sellerProfileRepository.existsById(userId);
        User savedUser = userRepository.save(user);
        return UserProfileRes.fromEntity(savedUser, hasSellerProfile, mediaUrlBuilder.buildAvatarUrl(uploadedAvatar));
    }

    @Transactional
    public UserProfileRes clearCurrentUserAvatar(String userId) {
        User user = findUser(userId);
        MediaAsset currentAvatar = user.getAvatarMedia();
        if (currentAvatar != null) {
            user.setAvatarMedia(null);
            mediaAssetService.markPendingDelete(currentAvatar);
        }

        boolean hasSellerProfile = sellerProfileRepository.existsById(userId);
        User savedUser = userRepository.save(user);
        return UserProfileRes.fromEntity(savedUser, hasSellerProfile, null);
    }

    private void ensureUserExists(String userId) {
        if (!userRepository.existsById(userId)) {
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, "User not found");
        }
    }

    private User findUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "User not found"));
    }

    private MediaUploadContext buildAvatarContext(String userId) {
        String folder = properties.getBaseFolder().trim() + "/users/" + userId + "/avatar";
        return new MediaUploadContext(
                userId,
                MediaUsageType.USER_AVATAR,
                MediaResourceType.IMAGE,
                folder,
                properties.getUpload().getAvatarMaxBytes(),
                "image/"
        );
    }
}
