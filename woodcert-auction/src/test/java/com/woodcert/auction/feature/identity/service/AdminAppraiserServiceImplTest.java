package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.catalog.repository.ProductRepository;
import com.woodcert.auction.feature.identity.dto.request.CreateAdminAppraiserReq;
import com.woodcert.auction.feature.identity.dto.response.AdminUserRes;
import com.woodcert.auction.feature.identity.entity.Role;
import com.woodcert.auction.feature.identity.entity.User;
import com.woodcert.auction.feature.identity.entity.UserStatus;
import com.woodcert.auction.feature.identity.repository.RefreshTokenRepository;
import com.woodcert.auction.feature.identity.repository.RoleRepository;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminAppraiserServiceImplTest {

    private static final String APPRAISER_ROLE = "ROLE_APPRAISER";
    private static final String USER_ID = "user-123";
    private static final String EMAIL = "test@woodcert.local";
    private static final String PHONE = "0912345678";

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    private AdminAppraiserServiceImpl adminAppraiserService;

    private Role appraiserRole() {
        Role role = new Role();
        role.setName(APPRAISER_ROLE);
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
            Role role = new Role();
            role.setName(roleName);
            user.getRoles().add(role);
        }
        return user;
    }

    @Test
    void createAppraiser_newEmail_success() {
        CreateAdminAppraiserReq req = new CreateAdminAppraiserReq(EMAIL, "pass1234", "Test User", PHONE);

        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());
        when(userRepository.existsByPhoneNumber(PHONE)).thenReturn(false);
        when(roleRepository.findByName(APPRAISER_ROLE)).thenReturn(Optional.of(appraiserRole()));
        when(passwordEncoder.encode("pass1234")).thenReturn("hashedPass");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminUserRes result = adminAppraiserService.createAppraiser(req);

        assertThat(result.email()).isEqualTo(EMAIL);
        assertThat(result.fullName()).isEqualTo("Test User");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void createAppraiser_existingUserWithoutRoleAppraiser_promotesToAppraiser() {
        CreateAdminAppraiserReq req = new CreateAdminAppraiserReq(EMAIL, "pass1234", "New Name", PHONE);
        User existingUser = testUser(USER_ID, EMAIL, UserStatus.ACTIVE, "ROLE_BIDDER");

        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(existingUser));
        when(userRepository.existsByPhoneNumberAndIdNot(PHONE, USER_ID)).thenReturn(false);
        when(roleRepository.findByName(APPRAISER_ROLE)).thenReturn(Optional.of(appraiserRole()));
        when(passwordEncoder.encode("pass1234")).thenReturn("hashedPass");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminUserRes result = adminAppraiserService.createAppraiser(req);

        assertThat(result.email()).isEqualTo(EMAIL);
        assertThat(result.fullName()).isEqualTo("New Name");
        assertThat(existingUser.getRoles().stream().anyMatch(r -> r.getName().equals(APPRAISER_ROLE))).isTrue();
        verify(userRepository).save(existingUser);
    }

    @Test
    void createAppraiser_existingUserWithRoleAppraiser_throwsDuplicateException() {
        CreateAdminAppraiserReq req = new CreateAdminAppraiserReq(EMAIL, "pass1234", "Test User", PHONE);
        User existingUser = testUser(USER_ID, EMAIL, UserStatus.ACTIVE, APPRAISER_ROLE);

        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(existingUser));

        assertThatThrownBy(() -> adminAppraiserService.createAppraiser(req))
                .isInstanceOf(AppException.class)
                .extracting(ex -> ((AppException) ex).getErrorCode())
                .isEqualTo(ErrorCode.DUPLICATE_RESOURCE);
        verify(userRepository, never()).save(any());
    }

    @Test
    void createAppraiser_existingBannedAppraiser_throwsDuplicateException() {
        CreateAdminAppraiserReq req = new CreateAdminAppraiserReq(EMAIL, "pass1234", "New Name", PHONE);
        User existingUser = testUser(USER_ID, EMAIL, UserStatus.BANNED, APPRAISER_ROLE);

        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(existingUser));

        assertThatThrownBy(() -> adminAppraiserService.createAppraiser(req))
                .isInstanceOf(AppException.class)
                .extracting(ex -> ((AppException) ex).getErrorCode())
                .isEqualTo(ErrorCode.DUPLICATE_RESOURCE);
        verify(userRepository, never()).save(any());
    }

    @Test
    void demoteAppraiser_success() {
        User target = testUser(USER_ID, EMAIL, UserStatus.ACTIVE, APPRAISER_ROLE, "ROLE_BIDDER");

        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(target));
        when(productRepository.existsByAppraisalClaimedByAndStatusAndAppraisalClaimExpiresAtAfter(any(), any(), any()))
                .thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminUserRes result = adminAppraiserService.demoteAppraiser(USER_ID);

        assertThat(result.roles()).contains(APPRAISER_ROLE);
        assertThat(result.status()).isEqualTo("BANNED");
        assertThat(target.getRoles().stream().anyMatch(r -> r.getName().equals(APPRAISER_ROLE))).isTrue();
        assertThat(target.getStatus()).isEqualTo(UserStatus.BANNED);
        verify(refreshTokenRepository).revokeAllByUser(target);
        verify(userRepository).save(target);
    }

    @Test
    void demoteAppraiser_hasActiveClaims_throwsInvalidRequest() {
        User target = testUser(USER_ID, EMAIL, UserStatus.ACTIVE, APPRAISER_ROLE);

        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(target));
        when(productRepository.existsByAppraisalClaimedByAndStatusAndAppraisalClaimExpiresAtAfter(any(), any(), any()))
                .thenReturn(true);

        assertThatThrownBy(() -> adminAppraiserService.demoteAppraiser(USER_ID))
                .isInstanceOf(AppException.class)
                .extracting(ex -> ((AppException) ex).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_REQUEST);
        verify(refreshTokenRepository, never()).revokeAllByUser(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    void demoteAppraiser_rejectsNonAppraiser() {
        User target = testUser(USER_ID, EMAIL, UserStatus.ACTIVE, "ROLE_BIDDER");

        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(target));

        assertThatThrownBy(() -> adminAppraiserService.demoteAppraiser(USER_ID))
                .isInstanceOf(AppException.class)
                .extracting(ex -> ((AppException) ex).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_REQUEST);
        verify(refreshTokenRepository, never()).revokeAllByUser(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    void demoteAppraiser_rejectsAdmin() {
        User target = testUser(USER_ID, EMAIL, UserStatus.ACTIVE, APPRAISER_ROLE, "ROLE_ADMIN");

        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(target));

        assertThatThrownBy(() -> adminAppraiserService.demoteAppraiser(USER_ID))
                .isInstanceOf(AppException.class)
                .extracting(ex -> ((AppException) ex).getErrorCode())
                .isEqualTo(ErrorCode.CANNOT_BAN_ADMIN);
        verify(refreshTokenRepository, never()).revokeAllByUser(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    void demoteAppraiser_rejectsBannedAppraiser() {
        User target = testUser(USER_ID, EMAIL, UserStatus.BANNED, APPRAISER_ROLE);

        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(target));

        assertThatThrownBy(() -> adminAppraiserService.demoteAppraiser(USER_ID))
                .isInstanceOf(AppException.class)
                .extracting(ex -> ((AppException) ex).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_REQUEST);
        verify(refreshTokenRepository, never()).revokeAllByUser(any());
        verify(userRepository, never()).save(any());
    }
}
