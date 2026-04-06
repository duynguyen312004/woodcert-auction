package com.woodcert.auction.feature.identity.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.woodcert.auction.feature.identity.entity.Role;
import com.woodcert.auction.feature.identity.entity.User;

import java.util.Comparator;
import java.util.List;

/**
 * Current user profile response.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record UserProfileRes(
        String id,
        String email,
        String fullName,
        String phoneNumber,
        String avatarUrl,
        String status,
        List<String> roles,
        boolean hasSellerProfile
) {
    public static UserProfileRes fromEntity(User user, boolean hasSellerProfile) {
        List<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .sorted(Comparator.naturalOrder())
                .toList();

        return new UserProfileRes(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhoneNumber(),
                user.getAvatarUrl(),
                user.getStatus().name(),
                roles,
                hasSellerProfile
        );
    }
}
