package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.catalog.entity.ProductStatus;
import com.woodcert.auction.feature.catalog.repository.ProductRepository;
import com.woodcert.auction.feature.identity.dto.request.CreateAdminAppraiserReq;
import com.woodcert.auction.feature.identity.dto.response.AdminUserRes;
import com.woodcert.auction.feature.identity.entity.Role;
import com.woodcert.auction.feature.identity.entity.User;
import com.woodcert.auction.feature.identity.entity.UserStatus;
import com.woodcert.auction.feature.identity.repository.RefreshTokenRepository;
import com.woodcert.auction.feature.identity.repository.RoleRepository;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import com.woodcert.auction.feature.identity.util.IdentityNormalizationUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AdminAppraiserServiceImpl implements AdminAppraiserService {

    private static final String APPRAISER_ROLE = "ROLE_APPRAISER";
    private static final String ADMIN_ROLE = "ROLE_ADMIN";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final ProductRepository productRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenRepository refreshTokenRepository;

    @Override
    @Transactional
    public AdminUserRes createAppraiser(CreateAdminAppraiserReq request) {
        String normalizedEmail = IdentityNormalizationUtils.normalizeEmail(request.email());
        String normalizedFullName = request.fullName().trim();
        String normalizedPhoneNumber = IdentityNormalizationUtils
                .normalizeVietnamesePhoneNullable(request.phoneNumber());

        var existingUserOpt = userRepository.findByEmail(normalizedEmail);
        if (existingUserOpt.isPresent()) {
            User user = existingUserOpt.get();
            boolean isAlreadyAppraiser = hasRole(user, APPRAISER_ROLE);
            if (isAlreadyAppraiser) {
                throw new AppException(ErrorCode.DUPLICATE_RESOURCE, "Email already exists");
            }

            if (!isAlreadyAppraiser) {
                user.getRoles().add(findAppraiserRole());
            }
            user.setFullName(normalizedFullName);
            if (normalizedPhoneNumber != null) {
                if (userRepository.existsByPhoneNumberAndIdNot(normalizedPhoneNumber, user.getId())) {
                    throw new AppException(ErrorCode.DUPLICATE_RESOURCE, "Phone number already exists");
                }
                user.setPhoneNumber(normalizedPhoneNumber);
            }
            user.setPasswordHash(passwordEncoder.encode(request.password()));
            user.setStatus(UserStatus.ACTIVE);

            return AdminUserRes.fromEntity(userRepository.save(user));
        }

        if (normalizedPhoneNumber != null && userRepository.existsByPhoneNumber(normalizedPhoneNumber)) {
            throw new AppException(ErrorCode.DUPLICATE_RESOURCE, "Phone number already exists");
        }

        User user = new User();
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFullName(normalizedFullName);
        user.setPhoneNumber(normalizedPhoneNumber);
        user.setStatus(UserStatus.ACTIVE);
        user.getRoles().add(findAppraiserRole());

        return AdminUserRes.fromEntity(userRepository.save(user));
    }

    @Override
    @Transactional
    public AdminUserRes demoteAppraiser(String userId) {
        User user = findUser(userId);
        if (hasRole(user, ADMIN_ROLE)) {
            throw new AppException(ErrorCode.CANNOT_BAN_ADMIN);
        }
        if (!hasRole(user, APPRAISER_ROLE)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "User is not an appraiser");
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Only active appraisers can be banned");
        }
        if (productRepository.existsByAppraisalClaimedByAndStatusAndAppraisalClaimExpiresAtAfter(
                userId,
                ProductStatus.UNDER_APPRAISAL,
                Instant.now())) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Appraiser has an active appraisal claim");
        }
        user.setStatus(UserStatus.BANNED);
        refreshTokenRepository.revokeAllByUser(user);
        return AdminUserRes.fromEntity(userRepository.save(user));
    }

    private User findUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "User not found"));
    }

    private Role findAppraiserRole() {
        return roleRepository.findByName(APPRAISER_ROLE)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Role ROLE_APPRAISER not found"));
    }

    private boolean hasRole(User user, String roleName) {
        return user.getRoles().stream().map(Role::getName).anyMatch(roleName::equals);
    }
}
