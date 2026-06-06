package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.identity.dto.response.CurrentUserCapabilityStatusRes;
import com.woodcert.auction.feature.identity.dto.response.UserProfileRes;
import com.woodcert.auction.feature.identity.entity.User;
import com.woodcert.auction.feature.identity.repository.SellerProfileRepository;
import com.woodcert.auction.feature.identity.repository.UserCapabilityStatusRepository;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import com.woodcert.auction.feature.media.config.CloudinaryProperties;
import com.woodcert.auction.feature.media.dto.request.ConfirmMediaUploadReq;
import com.woodcert.auction.feature.media.dto.request.CreateMediaUploadIntentReq;
import com.woodcert.auction.feature.media.dto.response.MediaUploadIntentRes;
import com.woodcert.auction.feature.media.entity.MediaAsset;
import com.woodcert.auction.feature.media.entity.MediaResourceType;
import com.woodcert.auction.feature.media.entity.MediaUsageType;
import com.woodcert.auction.feature.media.service.MediaAssetService;
import com.woodcert.auction.feature.media.support.MediaUploadContext;
import com.woodcert.auction.feature.media.util.MediaUrlBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserAvatarServiceImpl implements UserAvatarService {

    private final UserRepository userRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final UserCapabilityStatusRepository capabilityStatusRepository;
    private final CloudinaryProperties properties;
    private final MediaAssetService mediaAssetService;
    private final MediaUrlBuilder mediaUrlBuilder;

    @Override
    @Transactional
    public MediaUploadIntentRes createCurrentUserAvatarUploadIntent(String userId, CreateMediaUploadIntentReq request) {
        // Bước 1: Kiểm tra user tồn tại trước khi cấp intent upload avatar.
        ensureUserExists(userId);

        // Bước 2: Tạo intent upload với folder và giới hạn dung lượng dành riêng cho avatar.
        return mediaAssetService.createUploadIntent(buildAvatarContext(userId), request);
    }

    @Override
    @Transactional
    public UserProfileRes attachCurrentUserAvatar(String userId, ConfirmMediaUploadReq request) {
        // Bước 1: Đọc user hiện tại và giữ lại avatar cũ để dọn nếu bị thay thế.
        User user = findUser(userId);
        MediaAsset currentAvatar = user.getAvatarMedia();

        // Bước 2: Xác nhận upload thuộc user hiện tại trước khi gắn vào profile.
        MediaAsset uploadedAvatar = mediaAssetService.confirmOwnedUpload(userId, request);

        // Bước 3: Gắn avatar mới; nếu avatar cũ khác avatar mới thì đánh dấu xóa media cũ.
        user.setAvatarMedia(uploadedAvatar);
        if (currentAvatar != null && !currentAvatar.getId().equals(uploadedAvatar.getId())) {
            mediaAssetService.markPendingDelete(currentAvatar);
        }

        // Bước 4: Lưu user và trả profile với URL avatar mới.
        boolean hasSellerProfile = sellerProfileRepository.existsById(userId);
        User savedUser = userRepository.save(user);
        return toUserProfile(savedUser, hasSellerProfile, mediaUrlBuilder.buildAvatarUrl(uploadedAvatar));
    }

    @Override
    @Transactional
    public UserProfileRes clearCurrentUserAvatar(String userId) {
        // Bước 1: Đọc user và avatar hiện tại.
        User user = findUser(userId);
        MediaAsset currentAvatar = user.getAvatarMedia();

        // Bước 2: Nếu có avatar thì bỏ liên kết khỏi user và đánh dấu media để dọn sau.
        if (currentAvatar != null) {
            user.setAvatarMedia(null);
            mediaAssetService.markPendingDelete(currentAvatar);
        }

        // Bước 3: Lưu user và trả profile không còn avatar URL.
        boolean hasSellerProfile = sellerProfileRepository.existsById(userId);
        User savedUser = userRepository.save(user);
        return toUserProfile(savedUser, hasSellerProfile, null);
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

    private UserProfileRes toUserProfile(User user, boolean hasSellerProfile, String avatarUrl) {
        var capabilityStatuses = capabilityStatusRepository.findByUserId(user.getId()).stream()
                .map(CurrentUserCapabilityStatusRes::fromEntity)
                .toList();
        return UserProfileRes.fromEntity(user, hasSellerProfile, avatarUrl, capabilityStatuses);
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
