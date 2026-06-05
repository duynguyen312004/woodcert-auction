package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.catalog.entity.ProductStatus;
import com.woodcert.auction.feature.catalog.repository.ProductRepository;
import com.woodcert.auction.feature.identity.dto.response.AdminUserRes;
import com.woodcert.auction.feature.identity.dto.response.CapabilityStatusRes;
import com.woodcert.auction.feature.identity.entity.AdminAction;
import com.woodcert.auction.feature.identity.entity.AdminTargetType;
import com.woodcert.auction.feature.identity.entity.CapabilityStatus;
import com.woodcert.auction.feature.identity.entity.Role;
import com.woodcert.auction.feature.identity.entity.User;
import com.woodcert.auction.feature.identity.entity.UserCapability;
import com.woodcert.auction.feature.identity.entity.UserCapabilityStatus;
import com.woodcert.auction.feature.identity.entity.UserStatus;
import com.woodcert.auction.feature.identity.repository.RefreshTokenRepository;
import com.woodcert.auction.feature.identity.repository.UserCapabilityStatusRepository;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {

    private static final String ADMIN_ROLE = "ROLE_ADMIN";
    private static final String BIDDER_ROLE = "ROLE_BIDDER";
    private static final String SELLER_ROLE = "ROLE_SELLER";
    private static final String APPRAISER_ROLE = "ROLE_APPRAISER";

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserCapabilityStatusRepository capabilityStatusRepository;
    private final AdminAuditLogService adminAuditLogService;
    private final ProductRepository productRepository;

    @Override
    @Transactional(readOnly = true)
    public PaginationResponse<AdminUserRes> getUsers(String role, String status, String query, int page, int size) {
        var pageable = PageRequest.of(Math.max(0, page - 1), Math.min(Math.max(size, 1), 50));
        Page<User> users = userRepository.searchUsersFiltered(
                trimToNull(role),
                parseStatus(status),
                trimToNull(query),
                pageable);
        return toPageResponse(users);
    }

    @Override
    @Transactional
    public AdminUserRes banUser(String userId, String currentUserId, String reason) {
        User user = findUser(userId);
        if (user.getId().equals(currentUserId)) {
            throw new AppException(ErrorCode.CANNOT_BAN_SELF);
        }
        if (isAdmin(user)) {
            throw new AppException(ErrorCode.CANNOT_BAN_ADMIN);
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Only active users can be banned");
        }

        user.setStatus(UserStatus.BANNED);
        refreshTokenRepository.revokeAllByUser(user);
        User saved = userRepository.save(user);
        adminAuditLogService.log(
                currentUserId,
                AdminAction.ACCOUNT_BANNED,
                AdminTargetType.USER,
                userId,
                normalizeReason(reason),
                Map.of("email", saved.getEmail()));
        return toRes(saved);
    }

    @Override
    @Transactional
    public AdminUserRes unbanUser(String userId, String currentUserId, String reason) {
        User user = findUser(userId);
        if (user.getStatus() != UserStatus.BANNED) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Only banned users can be unbanned");
        }

        user.setStatus(UserStatus.ACTIVE);
        User saved = userRepository.save(user);
        adminAuditLogService.log(
                currentUserId,
                AdminAction.ACCOUNT_UNBANNED,
                AdminTargetType.USER,
                userId,
                normalizeReason(reason),
                Map.of("email", saved.getEmail()));
        return toRes(saved);
    }

    @Override
    @Transactional
    public AdminUserRes banCapability(
            String userId,
            UserCapability capability,
            String currentUserId,
            String reason) {
        User user = findUser(userId);
        if (isAdmin(user)) {
            throw new AppException(ErrorCode.CANNOT_BAN_ADMIN);
        }
        ensureCapabilityApplies(user, capability);
        UserCapabilityStatus status = capabilityStatusRepository
                .findByUserIdAndCapability(userId, capability)
                .orElseGet(() -> newCapabilityStatus(userId, capability));
        if (status.getStatus() == CapabilityStatus.BANNED) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Capability is already banned");
        }

        status.setStatus(CapabilityStatus.BANNED);
        status.setReason(normalizeReason(reason));
        status.setUpdatedByAdminId(currentUserId);
        capabilityStatusRepository.save(status);

        int releasedClaimCount = releaseAppraiserClaimsIfNeeded(userId, capability);
        adminAuditLogService.log(
                currentUserId,
                actionFor(capability, true),
                AdminTargetType.USER,
                userId,
                status.getReason(),
                Map.of(
                        "capability", capability.name(),
                        "email", user.getEmail(),
                        "releasedClaimCount", releasedClaimCount));
        return toRes(user);
    }

    @Override
    @Transactional
    public AdminUserRes unbanCapability(
            String userId,
            UserCapability capability,
            String currentUserId,
            String reason) {
        User user = findUser(userId);
        if (isAdmin(user)) {
            throw new AppException(ErrorCode.CANNOT_BAN_ADMIN);
        }
        ensureCapabilityApplies(user, capability);
        UserCapabilityStatus status = capabilityStatusRepository
                .findByUserIdAndCapability(userId, capability)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST, "Capability is not banned"));
        if (status.getStatus() != CapabilityStatus.BANNED) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Capability is not banned");
        }

        status.setStatus(CapabilityStatus.ACTIVE);
        status.setReason(normalizeReason(reason));
        status.setUpdatedByAdminId(currentUserId);
        capabilityStatusRepository.save(status);
        adminAuditLogService.log(
                currentUserId,
                actionFor(capability, false),
                AdminTargetType.USER,
                userId,
                status.getReason(),
                Map.of("capability", capability.name(), "email", user.getEmail()));
        return toRes(user);
    }

    private User findUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "User not found"));
    }

    private boolean isAdmin(User user) {
        return user.getRoles().stream().map(Role::getName).anyMatch(ADMIN_ROLE::equals);
    }

    private void ensureCapabilityApplies(User user, UserCapability capability) {
        String role = switch (capability) {
            case BUYER -> BIDDER_ROLE;
            case SELLER -> SELLER_ROLE;
            case APPRAISER -> APPRAISER_ROLE;
        };
        if (!hasRole(user, role)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "User does not have capability " + capability.name());
        }
    }

    private boolean hasRole(User user, String roleName) {
        return user.getRoles().stream().map(Role::getName).anyMatch(roleName::equals);
    }

    private UserCapabilityStatus newCapabilityStatus(String userId, UserCapability capability) {
        UserCapabilityStatus status = new UserCapabilityStatus();
        status.setUserId(userId);
        status.setCapability(capability);
        status.setStatus(CapabilityStatus.ACTIVE);
        return status;
    }

    private AdminAction actionFor(UserCapability capability, boolean banned) {
        return switch (capability) {
            case BUYER -> banned ? AdminAction.BUYER_BANNED : AdminAction.BUYER_UNBANNED;
            case SELLER -> banned ? AdminAction.SELLER_BANNED : AdminAction.SELLER_UNBANNED;
            case APPRAISER -> banned ? AdminAction.APPRAISER_BANNED : AdminAction.APPRAISER_UNBANNED;
        };
    }

    private int releaseAppraiserClaimsIfNeeded(String userId, UserCapability capability) {
        if (capability != UserCapability.APPRAISER) {
            return 0;
        }
        return productRepository.releaseAllActiveClaimsByAppraiser(
                userId,
                ProductStatus.UNDER_APPRAISAL,
                ProductStatus.PENDING_APPRAISAL,
                Instant.now());
    }

    private PaginationResponse<AdminUserRes> toPageResponse(Page<User> users) {
        Map<String, List<CapabilityStatusRes>> statuses = capabilityStatusRepository
                .findByUserIdIn(users.getContent().stream().map(User::getId).toList())
                .stream()
                .collect(Collectors.groupingBy(
                        UserCapabilityStatus::getUserId,
                        Collectors.mapping(CapabilityStatusRes::fromEntity, Collectors.toList())));
        List<AdminUserRes> mapped = users.getContent().stream()
                .map(user -> AdminUserRes.fromEntity(user, statuses.getOrDefault(user.getId(), List.of())))
                .toList();
        return PaginationResponse.of(new PageImpl<>(mapped, users.getPageable(), users.getTotalElements()));
    }

    private AdminUserRes toRes(User user) {
        List<CapabilityStatusRes> statuses = capabilityStatusRepository.findByUserId(user.getId()).stream()
                .map(CapabilityStatusRes::fromEntity)
                .toList();
        return AdminUserRes.fromEntity(user, statuses);
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

    private String normalizeReason(String reason) {
        String normalized = trimToNull(reason);
        if (normalized == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Reason is required");
        }
        if (normalized.length() > 1000) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Reason must not exceed 1000 characters");
        }
        return normalized;
    }
}
