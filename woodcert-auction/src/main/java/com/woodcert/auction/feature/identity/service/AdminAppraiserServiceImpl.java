package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.catalog.entity.ProductStatus;
import com.woodcert.auction.feature.catalog.repository.ProductRepository;
import com.woodcert.auction.feature.identity.dto.response.AdminUserRes;
import com.woodcert.auction.feature.identity.entity.Role;
import com.woodcert.auction.feature.identity.entity.User;
import com.woodcert.auction.feature.identity.entity.UserStatus;
import com.woodcert.auction.feature.identity.repository.RoleRepository;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AdminAppraiserServiceImpl implements AdminAppraiserService {

    private static final String APPRAISER_ROLE = "ROLE_APPRAISER";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final ProductRepository productRepository;

    @Override
    @Transactional(readOnly = true)
    public PaginationResponse<AdminUserRes> getUsers(String query, int page, int size) {
        var pageable = PageRequest.of(Math.max(0, page - 1), Math.min(Math.max(size, 1), 50));
        return PaginationResponse.of(userRepository
                .searchUsersWithRoles(trimToNull(query), pageable)
                .map(AdminUserRes::fromEntity));
    }

    @Override
    @Transactional
    public AdminUserRes promoteAppraiser(String userId) {
        User user = findUser(userId);
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Only active users can become appraisers");
        }
        boolean alreadyAppraiser = user.getRoles().stream().map(Role::getName).anyMatch(APPRAISER_ROLE::equals);
        if (!alreadyAppraiser) {
            user.getRoles().add(findAppraiserRole());
        }
        return AdminUserRes.fromEntity(userRepository.save(user));
    }

    @Override
    @Transactional
    public AdminUserRes demoteAppraiser(String userId) {
        User user = findUser(userId);
        if (productRepository.existsByAppraisalClaimedByAndStatusAndAppraisalClaimExpiresAtAfter(
                userId,
                ProductStatus.UNDER_APPRAISAL,
                Instant.now())) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Appraiser has an active appraisal claim");
        }
        user.getRoles().removeIf(role -> APPRAISER_ROLE.equals(role.getName()));
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

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
