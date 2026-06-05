package com.woodcert.auction.feature.identity.dto.response;

import com.woodcert.auction.feature.identity.entity.Role;
import com.woodcert.auction.feature.identity.entity.User;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;

public record AdminUserRes(
        String id,
        String email,
        String fullName,
        String phoneNumber,
        String status,
        List<String> roles,
        Instant createdAt,
        List<CapabilityStatusRes> capabilityStatuses
) {
    public AdminUserRes(
            String id,
            String email,
            String fullName,
            String phoneNumber,
            String status,
            List<String> roles,
            Instant createdAt) {
        this(id, email, fullName, phoneNumber, status, roles, createdAt, List.of());
    }

    public static AdminUserRes fromEntity(User user) {
        return fromEntity(user, List.of());
    }

    public static AdminUserRes fromEntity(User user, List<CapabilityStatusRes> capabilityStatuses) {
        return new AdminUserRes(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhoneNumber(),
                user.getStatus().name(),
                user.getRoles().stream()
                        .map(Role::getName)
                        .sorted(Comparator.naturalOrder())
                        .toList(),
                user.getCreatedAt(),
                capabilityStatuses
        );
    }
}
