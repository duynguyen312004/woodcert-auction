package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.catalog.entity.ProductStatus;
import com.woodcert.auction.feature.catalog.repository.ProductRepository;
import com.woodcert.auction.feature.identity.dto.request.CreateAdminAppraiserReq;
import com.woodcert.auction.feature.identity.dto.response.AdminUserRes;
import com.woodcert.auction.feature.identity.entity.CapabilityStatus;
import com.woodcert.auction.feature.identity.entity.Role;
import com.woodcert.auction.feature.identity.entity.User;
import com.woodcert.auction.feature.identity.entity.UserCapability;
import com.woodcert.auction.feature.identity.entity.UserCapabilityStatus;
import com.woodcert.auction.feature.identity.entity.UserStatus;
import com.woodcert.auction.feature.identity.repository.RoleRepository;
import com.woodcert.auction.feature.identity.repository.UserCapabilityStatusRepository;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminAppraiserServiceImplTest {

    private static final String ADMIN_ID = "admin-1";
    private static final String APPRAISER_ROLE = "ROLE_APPRAISER";
    private static final String USER_ID = "user-123";
    private static final String EMAIL = "test@woodcert.local";
    private static final String PHONE = "0912345678";
    private static final String REASON = "Quality breach";

    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private ProductRepository productRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private UserCapabilityStatusRepository capabilityStatusRepository;
    @Mock private AdminAuditLogService adminAuditLogService;

    @InjectMocks private AdminAppraiserServiceImpl adminAppraiserService;

    @Test
    void createAppraiser_newEmail_success() {
        CreateAdminAppraiserReq req = new CreateAdminAppraiserReq(EMAIL, "pass1234", "Test User", PHONE);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());
        when(userRepository.existsByPhoneNumber(PHONE)).thenReturn(false);
        when(roleRepository.findByName(APPRAISER_ROLE)).thenReturn(Optional.of(role(APPRAISER_ROLE)));
        when(passwordEncoder.encode("pass1234")).thenReturn("hashedPass");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(USER_ID);
            return user;
        });

        AdminUserRes result = adminAppraiserService.createAppraiser(ADMIN_ID, req);

        assertThat(result.email()).isEqualTo(EMAIL);
        assertThat(result.roles()).contains(APPRAISER_ROLE);
        verify(adminAuditLogService).log(any(), any(), any(), any(), any(), any());
    }

    @Test
    void createAppraiser_existingActiveUserWithoutRole_promotesToAppraiser() {
        CreateAdminAppraiserReq req = new CreateAdminAppraiserReq(EMAIL, "pass1234", "New Name", PHONE);
        User existingUser = testUser(USER_ID, EMAIL, UserStatus.ACTIVE, "ROLE_BIDDER");
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(existingUser));
        when(userRepository.existsByPhoneNumberAndIdNot(PHONE, USER_ID)).thenReturn(false);
        when(roleRepository.findByName(APPRAISER_ROLE)).thenReturn(Optional.of(role(APPRAISER_ROLE)));
        when(passwordEncoder.encode("pass1234")).thenReturn("hashedPass");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminUserRes result = adminAppraiserService.createAppraiser(ADMIN_ID, req);

        assertThat(result.email()).isEqualTo(EMAIL);
        assertThat(result.fullName()).isEqualTo("New Name");
        assertThat(existingUser.getRoles().stream().anyMatch(r -> r.getName().equals(APPRAISER_ROLE))).isTrue();
    }

    @Test
    void createAppraiser_existingBannedNonAppraiser_throwsInvalidRequest() {
        CreateAdminAppraiserReq req = new CreateAdminAppraiserReq(EMAIL, "pass1234", "New Name", PHONE);
        User existingUser = testUser(USER_ID, EMAIL, UserStatus.BANNED, "ROLE_BIDDER");
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(existingUser));

        assertThatThrownBy(() -> adminAppraiserService.createAppraiser(ADMIN_ID, req))
                .isInstanceOf(AppException.class)
                .extracting(ex -> ((AppException) ex).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_REQUEST);
        verify(userRepository, never()).save(any());
    }

    @Test
    void createAppraiser_existingUserWithRoleAppraiser_throwsDuplicateException() {
        CreateAdminAppraiserReq req = new CreateAdminAppraiserReq(EMAIL, "pass1234", "Test User", PHONE);
        User existingUser = testUser(USER_ID, EMAIL, UserStatus.BANNED, APPRAISER_ROLE);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(existingUser));

        assertThatThrownBy(() -> adminAppraiserService.createAppraiser(ADMIN_ID, req))
                .isInstanceOf(AppException.class)
                .extracting(ex -> ((AppException) ex).getErrorCode())
                .isEqualTo(ErrorCode.DUPLICATE_RESOURCE);
        verify(userRepository, never()).save(any());
    }

    @Test
    void banAppraiser_bansCapabilityAndReleasesClaims() {
        User target = testUser(USER_ID, EMAIL, UserStatus.ACTIVE, APPRAISER_ROLE, "ROLE_BIDDER");
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(target));
        when(capabilityStatusRepository.findByUserIdAndCapability(USER_ID, UserCapability.APPRAISER))
                .thenReturn(Optional.empty());
        when(productRepository.releaseAllActiveClaimsByAppraiser(
                eq(USER_ID),
                eq(ProductStatus.UNDER_APPRAISAL),
                eq(ProductStatus.PENDING_APPRAISAL),
                any(Instant.class))).thenReturn(2);

        AdminUserRes result = adminAppraiserService.banAppraiser(ADMIN_ID, USER_ID, REASON);

        assertThat(result.status()).isEqualTo("ACTIVE");
        assertThat(result.roles()).contains(APPRAISER_ROLE);
        verify(capabilityStatusRepository).save(any(UserCapabilityStatus.class));
        verify(productRepository).releaseAllActiveClaimsByAppraiser(
                eq(USER_ID),
                eq(ProductStatus.UNDER_APPRAISAL),
                eq(ProductStatus.PENDING_APPRAISAL),
                any(Instant.class));
        verify(adminAuditLogService).log(any(), any(), any(), any(), any(), any());
        verify(userRepository, never()).save(target);
    }

    @Test
    void unbanAppraiser_success() {
        User target = testUser(USER_ID, EMAIL, UserStatus.ACTIVE, APPRAISER_ROLE);
        UserCapabilityStatus status = new UserCapabilityStatus();
        status.setUserId(USER_ID);
        status.setCapability(UserCapability.APPRAISER);
        status.setStatus(CapabilityStatus.BANNED);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(target));
        when(capabilityStatusRepository.findByUserIdAndCapability(USER_ID, UserCapability.APPRAISER))
                .thenReturn(Optional.of(status));

        AdminUserRes result = adminAppraiserService.unbanAppraiser(ADMIN_ID, USER_ID, REASON);

        assertThat(result.status()).isEqualTo("ACTIVE");
        assertThat(status.getStatus()).isEqualTo(CapabilityStatus.ACTIVE);
        verify(capabilityStatusRepository).save(status);
    }

    @Test
    void banAppraiser_rejectsNonAppraiser() {
        User target = testUser(USER_ID, EMAIL, UserStatus.ACTIVE, "ROLE_BIDDER");
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(target));

        assertThatThrownBy(() -> adminAppraiserService.banAppraiser(ADMIN_ID, USER_ID, REASON))
                .isInstanceOf(AppException.class)
                .extracting(ex -> ((AppException) ex).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_REQUEST);
        verify(capabilityStatusRepository, never()).save(any());
    }

    @Test
    void banAppraiser_rejectsAdmin() {
        User target = testUser(USER_ID, EMAIL, UserStatus.ACTIVE, APPRAISER_ROLE, "ROLE_ADMIN");
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(target));

        assertThatThrownBy(() -> adminAppraiserService.banAppraiser(ADMIN_ID, USER_ID, REASON))
                .isInstanceOf(AppException.class)
                .extracting(ex -> ((AppException) ex).getErrorCode())
                .isEqualTo(ErrorCode.CANNOT_BAN_ADMIN);
        verify(capabilityStatusRepository, never()).save(any());
    }

    private Role role(String roleName) {
        Role role = new Role();
        role.setName(roleName);
        return role;
    }

    private User testUser(String id, String email, UserStatus status, String... roleNames) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setFullName("Test User");
        user.setPhoneNumber(PHONE);
        user.setStatus(status);
        for (String roleName : roleNames) {
            user.getRoles().add(role(roleName));
        }
        return user;
    }
}
