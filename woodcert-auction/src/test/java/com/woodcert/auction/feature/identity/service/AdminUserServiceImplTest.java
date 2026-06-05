package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.identity.dto.response.AdminUserRes;
import com.woodcert.auction.feature.identity.entity.Role;
import com.woodcert.auction.feature.identity.entity.User;
import com.woodcert.auction.feature.identity.entity.UserStatus;
import com.woodcert.auction.feature.identity.repository.RefreshTokenRepository;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceImplTest {

    private static final String ADMIN_ID = "admin-1";
    private static final String TARGET_ID = "user-1";

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    private AdminUserServiceImpl adminUserService;

    private User user(String id, UserStatus status, String... roleNames) {
        User user = new User();
        user.setId(id);
        user.setEmail(id + "@example.com");
        user.setFullName("User " + id);
        user.setStatus(status);
        for (String roleName : roleNames) {
            Role role = new Role();
            role.setName(roleName);
            user.getRoles().add(role);
        }
        return user;
    }

    @Test
    void banUser_success() {
        User target = user(TARGET_ID, UserStatus.ACTIVE, "ROLE_BIDDER");
        when(userRepository.findById(TARGET_ID)).thenReturn(Optional.of(target));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminUserRes result = adminUserService.banUser(TARGET_ID, ADMIN_ID);

        assertThat(result.status()).isEqualTo("BANNED");
        assertThat(target.getStatus()).isEqualTo(UserStatus.BANNED);
        verify(refreshTokenRepository).revokeAllByUser(target);
    }

    @Test
    void banUser_rejectsSelf() {
        User self = user(ADMIN_ID, UserStatus.ACTIVE, "ROLE_BIDDER");
        when(userRepository.findById(ADMIN_ID)).thenReturn(Optional.of(self));

        assertThatThrownBy(() -> adminUserService.banUser(ADMIN_ID, ADMIN_ID))
                .isInstanceOf(AppException.class)
                .extracting(ex -> ((AppException) ex).getErrorCode())
                .isEqualTo(ErrorCode.CANNOT_BAN_SELF);
        verify(userRepository, never()).save(any());
    }

    @Test
    void banUser_rejectsAdmin() {
        User admin = user(TARGET_ID, UserStatus.ACTIVE, "ROLE_ADMIN");
        when(userRepository.findById(TARGET_ID)).thenReturn(Optional.of(admin));

        assertThatThrownBy(() -> adminUserService.banUser(TARGET_ID, ADMIN_ID))
                .isInstanceOf(AppException.class)
                .extracting(ex -> ((AppException) ex).getErrorCode())
                .isEqualTo(ErrorCode.CANNOT_BAN_ADMIN);
        verify(userRepository, never()).save(any());
    }

    @Test
    void banUser_rejectsNonActive() {
        User banned = user(TARGET_ID, UserStatus.BANNED, "ROLE_BIDDER");
        when(userRepository.findById(TARGET_ID)).thenReturn(Optional.of(banned));

        assertThatThrownBy(() -> adminUserService.banUser(TARGET_ID, ADMIN_ID))
                .isInstanceOf(AppException.class)
                .extracting(ex -> ((AppException) ex).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_REQUEST);
        verify(userRepository, never()).save(any());
    }

    @Test
    void banUser_notFound() {
        when(userRepository.findById(TARGET_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adminUserService.banUser(TARGET_ID, ADMIN_ID))
                .isInstanceOf(AppException.class)
                .extracting(ex -> ((AppException) ex).getErrorCode())
                .isEqualTo(ErrorCode.RESOURCE_NOT_FOUND);
    }

    @Test
    void unbanUser_success() {
        User target = user(TARGET_ID, UserStatus.BANNED, "ROLE_BIDDER");
        when(userRepository.findById(TARGET_ID)).thenReturn(Optional.of(target));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminUserRes result = adminUserService.unbanUser(TARGET_ID);

        assertThat(result.status()).isEqualTo("ACTIVE");
        assertThat(target.getStatus()).isEqualTo(UserStatus.ACTIVE);
    }

    @Test
    void unbanUser_rejectsNotBanned() {
        User target = user(TARGET_ID, UserStatus.ACTIVE, "ROLE_BIDDER");
        when(userRepository.findById(TARGET_ID)).thenReturn(Optional.of(target));

        assertThatThrownBy(() -> adminUserService.unbanUser(TARGET_ID))
                .isInstanceOf(AppException.class)
                .extracting(ex -> ((AppException) ex).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_REQUEST);
        verify(userRepository, never()).save(any());
    }

    @Test
    void getUsers_invalidStatusThrows() {
        assertThatThrownBy(() -> adminUserService.getUsers(null, "NOPE", null, 1, 20))
                .isInstanceOf(AppException.class)
                .extracting(ex -> ((AppException) ex).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_REQUEST);
    }
}
