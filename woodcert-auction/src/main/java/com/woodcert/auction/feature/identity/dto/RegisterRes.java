package com.woodcert.auction.feature.identity.dto;

import com.woodcert.auction.feature.identity.entity.User;

import java.time.Instant;

/**
 * Registration response DTO.
 * Matches API_SPEC.md register response structure.
 */
public record RegisterRes(
        String id,
        String email,
        String fullName,
        String status,
        Instant createdAt
) {
    public static RegisterRes fromEntity(User user) {
        return new RegisterRes(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getStatus().name(),
                user.getCreatedAt()
        );
    }
}
