package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.identity.dto.response.AdminUserRes;
import com.woodcert.auction.feature.identity.entity.Role;
import com.woodcert.auction.feature.identity.entity.User;
import com.woodcert.auction.feature.identity.entity.UserStatus;
import com.woodcert.auction.feature.identity.repository.RefreshTokenRepository;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {

    private static final String ADMIN_ROLE = "ROLE_ADMIN";

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    @Override
    @Transactional(readOnly = true)
    public PaginationResponse<AdminUserRes> getUsers(String role, String status, String query, int page, int size) {
        var pageable = PageRequest.of(Math.max(0, page - 1), Math.min(Math.max(size, 1), 50));
        return PaginationResponse.of(userRepository
                .searchUsersFiltered(trimToNull(role), parseStatus(status), trimToNull(query), pageable)
                .map(AdminUserRes::fromEntity));
    }

    @Override
    @Transactional
    public AdminUserRes banUser(String userId, String currentUserId) {
        User user = findUser(userId);
        // Bước 1: Chặn tự khóa và khóa tài khoản admin.
        if (user.getId().equals(currentUserId)) {
            throw new AppException(ErrorCode.CANNOT_BAN_SELF);
        }
        if (isAdmin(user)) {
            throw new AppException(ErrorCode.CANNOT_BAN_ADMIN);
        }
        // Bước 2: Chỉ khóa tài khoản đang hoạt động.
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Only active users can be banned");
        }
        user.setStatus(UserStatus.BANNED);
        refreshTokenRepository.revokeAllByUser(user);
        return AdminUserRes.fromEntity(userRepository.save(user));
    }

    @Override
    @Transactional
    public AdminUserRes unbanUser(String userId) {
        User user = findUser(userId);
        if (user.getStatus() != UserStatus.BANNED) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Only banned users can be unbanned");
        }
        user.setStatus(UserStatus.ACTIVE);
        return AdminUserRes.fromEntity(userRepository.save(user));
    }

    private User findUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "User not found"));
    }

    private boolean isAdmin(User user) {
        return user.getRoles().stream().map(Role::getName).anyMatch(ADMIN_ROLE::equals);
    }

    private UserStatus parseStatus(String status) {
        String normalized = trimToNull(status);
        if (normalized == null) {
            return null;
        }
        try {
            return UserStatus.valueOf(normalized.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Invalid user status: " + status);
        }
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
