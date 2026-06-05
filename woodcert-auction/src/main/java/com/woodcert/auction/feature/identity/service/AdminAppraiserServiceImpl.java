package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.catalog.entity.ProductStatus;
import com.woodcert.auction.feature.catalog.repository.ProductRepository;
import com.woodcert.auction.feature.identity.dto.request.CreateAdminAppraiserReq;
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
import com.woodcert.auction.feature.identity.repository.RoleRepository;
import com.woodcert.auction.feature.identity.repository.UserCapabilityStatusRepository;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import com.woodcert.auction.feature.identity.util.IdentityNormalizationUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminAppraiserServiceImpl implements AdminAppraiserService {

    private static final String APPRAISER_ROLE = "ROLE_APPRAISER";
    private static final String ADMIN_ROLE = "ROLE_ADMIN";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final ProductRepository productRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserCapabilityStatusRepository capabilityStatusRepository;
    private final AdminAuditLogService adminAuditLogService;

    @Override
    @Transactional
    public AdminUserRes createAppraiser(String adminId, CreateAdminAppraiserReq request) {
        String normalizedEmail = IdentityNormalizationUtils.normalizeEmail(request.email());
        String normalizedFullName = request.fullName().trim();
        String normalizedPhoneNumber = IdentityNormalizationUtils
                .normalizeVietnamesePhoneNullable(request.phoneNumber());

        User user = userRepository.findByEmail(normalizedEmail)
                .map(existing -> promoteExistingUser(existing, normalizedFullName, normalizedPhoneNumber, request.password()))
                .orElseGet(() -> createNewAppraiser(
                        normalizedEmail,
                        normalizedFullName,
                        normalizedPhoneNumber,
                        request.password()));

        adminAuditLogService.log(
                adminId,
                AdminAction.APPRAISER_CREATED,
                AdminTargetType.USER,
                user.getId(),
                null,
                Map.of("email", user.getEmail()));
        return toRes(user);
    }

    @Override
    @Transactional
    public AdminUserRes banAppraiser(String adminId, String userId, String reason) {
        User user = findUser(userId);
        ensureManageableAppraiser(user);

        UserCapabilityStatus status = capabilityStatusRepository
                .findByUserIdAndCapability(userId, UserCapability.APPRAISER)
                .orElseGet(() -> newCapabilityStatus(userId));
        if (status.getStatus() == CapabilityStatus.BANNED) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Appraiser capability is already banned");
        }

        status.setStatus(CapabilityStatus.BANNED);
        status.setReason(normalizeReason(reason));
        status.setUpdatedByAdminId(adminId);
        capabilityStatusRepository.save(status);

        int releasedClaimCount = productRepository.releaseAllActiveClaimsByAppraiser(
                userId,
                ProductStatus.UNDER_APPRAISAL,
                ProductStatus.PENDING_APPRAISAL,
                Instant.now());

        adminAuditLogService.log(
                adminId,
                AdminAction.APPRAISER_BANNED,
                AdminTargetType.USER,
                userId,
                status.getReason(),
                Map.of(
                        "email", user.getEmail(),
                        "releasedClaimCount", releasedClaimCount));
        return toRes(user);
    }

    @Override
    @Transactional
    public AdminUserRes unbanAppraiser(String adminId, String userId, String reason) {
        User user = findUser(userId);
        ensureManageableAppraiser(user);

        UserCapabilityStatus status = capabilityStatusRepository
                .findByUserIdAndCapability(userId, UserCapability.APPRAISER)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST, "Appraiser capability is not banned"));
        if (status.getStatus() != CapabilityStatus.BANNED) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Appraiser capability is not banned");
        }

        status.setStatus(CapabilityStatus.ACTIVE);
        status.setReason(normalizeReason(reason));
        status.setUpdatedByAdminId(adminId);
        capabilityStatusRepository.save(status);
        adminAuditLogService.log(
                adminId,
                AdminAction.APPRAISER_UNBANNED,
                AdminTargetType.USER,
                userId,
                status.getReason(),
                Map.of("email", user.getEmail()));
        return toRes(user);
    }

    private User promoteExistingUser(
            User user,
            String normalizedFullName,
            String normalizedPhoneNumber,
            String rawPassword) {
        if (hasRole(user, APPRAISER_ROLE)) {
            throw new AppException(ErrorCode.DUPLICATE_RESOURCE, "Email already exists");
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Only active users can be promoted to appraiser");
        }
        user.getRoles().add(findAppraiserRole());
        user.setFullName(normalizedFullName);
        if (normalizedPhoneNumber != null) {
            if (userRepository.existsByPhoneNumberAndIdNot(normalizedPhoneNumber, user.getId())) {
                throw new AppException(ErrorCode.DUPLICATE_RESOURCE, "Phone number already exists");
            }
            user.setPhoneNumber(normalizedPhoneNumber);
        }
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        return userRepository.save(user);
    }

    private User createNewAppraiser(
            String normalizedEmail,
            String normalizedFullName,
            String normalizedPhoneNumber,
            String rawPassword) {
        if (normalizedPhoneNumber != null && userRepository.existsByPhoneNumber(normalizedPhoneNumber)) {
            throw new AppException(ErrorCode.DUPLICATE_RESOURCE, "Phone number already exists");
        }

        User user = new User();
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setFullName(normalizedFullName);
        user.setPhoneNumber(normalizedPhoneNumber);
        user.setStatus(UserStatus.ACTIVE);
        user.getRoles().add(findAppraiserRole());
        return userRepository.save(user);
    }

    private void ensureManageableAppraiser(User user) {
        if (hasRole(user, ADMIN_ROLE)) {
            throw new AppException(ErrorCode.CANNOT_BAN_ADMIN);
        }
        if (!hasRole(user, APPRAISER_ROLE)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "User is not an appraiser");
        }
    }

    private User findUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "User not found"));
    }

    private Role findAppraiserRole() {
        return roleRepository.findByName(APPRAISER_ROLE)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Role ROLE_APPRAISER not found"));
    }

    private UserCapabilityStatus newCapabilityStatus(String userId) {
        UserCapabilityStatus status = new UserCapabilityStatus();
        status.setUserId(userId);
        status.setCapability(UserCapability.APPRAISER);
        status.setStatus(CapabilityStatus.ACTIVE);
        return status;
    }

    private boolean hasRole(User user, String roleName) {
        return user.getRoles().stream().map(Role::getName).anyMatch(roleName::equals);
    }

    private AdminUserRes toRes(User user) {
        List<CapabilityStatusRes> statuses = capabilityStatusRepository.findByUserId(user.getId()).stream()
                .map(CapabilityStatusRes::fromEntity)
                .toList();
        return AdminUserRes.fromEntity(user, statuses);
    }

    private String normalizeReason(String reason) {
        if (reason == null || reason.isBlank()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Reason is required");
        }
        String normalized = reason.trim();
        if (normalized.length() > 1000) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Reason must not exceed 1000 characters");
        }
        return normalized;
    }
}
