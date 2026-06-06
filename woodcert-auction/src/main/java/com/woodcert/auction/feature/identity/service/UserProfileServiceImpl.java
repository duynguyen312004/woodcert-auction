package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.fasterxml.jackson.databind.JsonNode;
import com.woodcert.auction.feature.identity.dto.request.IdentityRequestPatterns;
import com.woodcert.auction.feature.identity.dto.request.PatchUserProfileReq;
import com.woodcert.auction.feature.identity.dto.request.UpdateUserProfileReq;
import com.woodcert.auction.feature.identity.dto.response.CurrentUserCapabilityStatusRes;
import com.woodcert.auction.feature.identity.dto.response.UserProfileRes;
import com.woodcert.auction.feature.identity.entity.User;
import com.woodcert.auction.feature.identity.repository.SellerProfileRepository;
import com.woodcert.auction.feature.identity.repository.UserCapabilityStatusRepository;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import com.woodcert.auction.feature.identity.util.IdentityNormalizationUtils;
import com.woodcert.auction.feature.media.util.MediaUrlBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserProfileServiceImpl implements UserProfileService {

    private final UserRepository userRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final UserCapabilityStatusRepository capabilityStatusRepository;
    private final MediaUrlBuilder mediaUrlBuilder;

    @Override
    @Transactional(readOnly = true)
    public UserProfileRes getCurrentUserProfile(String userId) {
        User user = findUser(userId);
        boolean hasSellerProfile = sellerProfileRepository.existsById(userId);
        return toUserProfile(user, hasSellerProfile);
    }

    @Override
    @Transactional
    public UserProfileRes updateCurrentUserProfile(String userId, UpdateUserProfileReq request) {
        // Bước 1: Đọc user hiện tại và chuẩn hóa số điện thoại nếu request có gửi lên.
        User user = findUser(userId);

        String normalizedPhone = request.phoneNumber() == null
                ? null
                : IdentityNormalizationUtils.normalizeVietnamesePhoneNullable(request.phoneNumber());

        // Bước 2: Chặn số điện thoại đã thuộc user khác.
        if (normalizedPhone != null && hasPhoneConflict(normalizedPhone, userId)) {
            throw new AppException(ErrorCode.DUPLICATE_RESOURCE, "Phone number already exists");
        }

        // Bước 3: Chỉ cập nhật các field được gửi lên trong request.
        if (request.fullName() != null) {
            user.setFullName(request.fullName().trim());
        }
        if (request.phoneNumber() != null) {
            if (normalizedPhone == null) {
                throw new AppException(ErrorCode.INVALID_REQUEST, "Phone number cannot be empty");
            }
            user.setPhoneNumber(normalizedPhone);
        }

        // Bước 4: Lưu user và trả profile kèm cờ đã có seller profile hay chưa.
        boolean hasSellerProfile = sellerProfileRepository.existsById(userId);
        return toUserProfile(userRepository.save(user), hasSellerProfile);
    }

    @Override
    @Transactional
    public UserProfileRes patchCurrentUserProfile(String userId, PatchUserProfileReq request) {
        // Bước 1: PATCH phải có ít nhất một field để tránh request rỗng.
        if (request == null || !request.hasAnyField()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "At least one field must be provided");
        }

        // Bước 2: Đọc user hiện tại trước khi áp từng field patch.
        User user = findUser(userId);

        // Bước 3: Nếu patch fullName thì kiểm tra kiểu dữ liệu, format và độ dài trước khi lưu.
        if (request.fullName() != null) {
            String fullName = requireTextValue(request.fullName(), "fullName");
            validateFullName(fullName);
            user.setFullName(fullName.trim());
        }

        // Bước 4: Nếu patch phoneNumber thì không cho null/rỗng, chuẩn hóa và kiểm tra trùng.
        if (request.phoneNumber() != null) {
            if (request.phoneNumber().isNull() || request.phoneNumber().asText().trim().isEmpty()) {
                throw new AppException(ErrorCode.INVALID_REQUEST, "Phone number cannot be empty");
            } else {
                String phoneNumber = requireTextValue(request.phoneNumber(), "phoneNumber");
                validatePhoneNumber(phoneNumber);
                String normalizedPhone = IdentityNormalizationUtils.normalizeVietnamesePhoneNullable(phoneNumber);
                if (hasPhoneConflict(normalizedPhone, userId)) {
                    throw new AppException(ErrorCode.DUPLICATE_RESOURCE, "Phone number already exists");
                }
                user.setPhoneNumber(normalizedPhone);
            }
        }

        // Bước 5: Lưu user và trả DTO đã gắn avatar URL cùng trạng thái seller profile.
        boolean hasSellerProfile = sellerProfileRepository.existsById(userId);
        return toUserProfile(userRepository.save(user), hasSellerProfile);
    }

    private User findUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "User not found"));
    }

    private boolean hasPhoneConflict(String phoneNumber, String userId) {
        return userRepository.existsByPhoneNumberAndIdNot(phoneNumber, userId);
    }

    private String requireTextValue(JsonNode node, String fieldName) {
        if (!node.isTextual()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, fieldName + " must be a string");
        }
        return node.asText();
    }

    private void validateFullName(String fullName) {
        String normalized = fullName.trim();
        if (normalized.length() < 2 || normalized.length() > 100) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Full name must be between 2 and 100 characters");
        }
        if (!normalized.matches(IdentityRequestPatterns.HUMAN_NAME)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Full name contains invalid characters");
        }
    }

    private void validatePhoneNumber(String phoneNumber) {
        if (phoneNumber.length() > 20) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Phone number must not exceed 20 characters");
        }
        if (!phoneNumber.matches(IdentityRequestPatterns.VIETNAMESE_PHONE)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Phone number must be a valid Vietnamese phone number");
        }
    }

    private UserProfileRes toUserProfile(User user, boolean hasSellerProfile) {
        var capabilityStatuses = capabilityStatusRepository.findByUserId(user.getId()).stream()
                .map(CurrentUserCapabilityStatusRes::fromEntity)
                .toList();
        return UserProfileRes.fromEntity(
                user,
                hasSellerProfile,
                mediaUrlBuilder.buildAvatarUrl(user.getAvatarMedia()),
                capabilityStatuses);
    }
}
