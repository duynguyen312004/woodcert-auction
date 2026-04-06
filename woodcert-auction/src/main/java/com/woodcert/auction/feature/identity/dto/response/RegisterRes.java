package com.woodcert.auction.feature.identity.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.woodcert.auction.feature.identity.entity.User;

import java.time.Instant;

/**
 * Registration response DTO.
 * Matches API_SPEC.md register response structure.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
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
