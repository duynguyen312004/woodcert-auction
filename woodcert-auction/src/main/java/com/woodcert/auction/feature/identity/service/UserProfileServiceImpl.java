package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.fasterxml.jackson.databind.JsonNode;
import com.woodcert.auction.feature.identity.dto.request.IdentityRequestPatterns;
import com.woodcert.auction.feature.identity.dto.request.PatchUserProfileReq;
import com.woodcert.auction.feature.identity.dto.request.UpdateUserProfileReq;
import com.woodcert.auction.feature.identity.dto.response.UserProfileRes;
import com.woodcert.auction.feature.identity.entity.User;
import com.woodcert.auction.feature.identity.repository.SellerProfileRepository;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import com.woodcert.auction.feature.identity.util.IdentityNormalizationUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserProfileServiceImpl implements UserProfileService {

    private final UserRepository userRepository;
    private final SellerProfileRepository sellerProfileRepository;

    @Override
    @Transactional(readOnly = true)
    public UserProfileRes getCurrentUserProfile(String userId) {
        User user = findUser(userId);
        boolean hasSellerProfile = sellerProfileRepository.existsById(userId);
        return UserProfileRes.fromEntity(user, hasSellerProfile);
    }

    @Override
    @Transactional
    public UserProfileRes updateCurrentUserProfile(String userId, UpdateUserProfileReq request) {
        User user = findUser(userId);

        String normalizedPhone = request.phoneNumber() == null
                ? null
                : IdentityNormalizationUtils.normalizeVietnamesePhoneNullable(request.phoneNumber());

        if (normalizedPhone != null && hasPhoneConflict(normalizedPhone, userId)) {
            throw new AppException(ErrorCode.DUPLICATE_RESOURCE, "Phone number already exists");
        }

        if (request.fullName() != null) {
            user.setFullName(request.fullName().trim());
        }
        if (request.phoneNumber() != null) {
            user.setPhoneNumber(normalizedPhone);
        }
        if (request.avatarUrl() != null) {
            user.setAvatarUrl(IdentityNormalizationUtils.normalizeNullable(request.avatarUrl()));
        }

        boolean hasSellerProfile = sellerProfileRepository.existsById(userId);
        return UserProfileRes.fromEntity(userRepository.save(user), hasSellerProfile);
    }

    @Override
    @Transactional
    public UserProfileRes patchCurrentUserProfile(String userId, PatchUserProfileReq request) {
        if (request == null || !request.hasAnyField()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "At least one field must be provided");
        }

        User user = findUser(userId);

        if (request.fullName() != null) {
            String fullName = requireTextValue(request.fullName(), "fullName");
            validateFullName(fullName);
            user.setFullName(fullName.trim());
        }

        if (request.phoneNumber() != null) {
            if (request.phoneNumber().isNull()) {
                user.setPhoneNumber(null);
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

        if (request.avatarUrl() != null) {
            if (request.avatarUrl().isNull()) {
                user.setAvatarUrl(null);
            } else {
                String avatarUrl = requireTextValue(request.avatarUrl(), "avatarUrl");
                validateAvatarUrl(avatarUrl);
                user.setAvatarUrl(avatarUrl.trim());
            }
        }

        boolean hasSellerProfile = sellerProfileRepository.existsById(userId);
        return UserProfileRes.fromEntity(userRepository.save(user), hasSellerProfile);
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

    private void validateAvatarUrl(String avatarUrl) {
        if (avatarUrl.length() > 500) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Avatar URL must not exceed 500 characters");
        }
        if (!avatarUrl.matches(IdentityRequestPatterns.HTTP_URL_OR_BLANK) || avatarUrl.trim().isEmpty()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Avatar URL must be a valid http or https URL");
        }
    }
}
