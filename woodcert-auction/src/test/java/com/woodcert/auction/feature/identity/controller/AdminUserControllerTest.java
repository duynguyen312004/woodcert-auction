package com.woodcert.auction.feature.identity.controller;

import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.feature.identity.dto.response.AdminUserRes;
import com.woodcert.auction.feature.identity.service.AdminUserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserControllerTest {

    private static final String ADMIN_ID = "admin-1";
    private static final String TARGET_ID = "user-1";

    @Mock private AdminUserService adminUserService;

    @InjectMocks private AdminUserController controller;

    private AdminUserRes res(String status) {
        return new AdminUserRes(TARGET_ID, "user@example.com", "User", null, status,
                List.of("ROLE_BIDDER"), Instant.now());
    }

    @Test
    void getUsers_delegatesToServiceWithParams() {
        PaginationResponse<AdminUserRes> page = new PaginationResponse<>(
                new PaginationResponse.Meta(1, 20, 1, 1), List.of(res("ACTIVE")));
        when(adminUserService.getUsers("ROLE_SELLER", "ACTIVE", "abc", 2, 20)).thenReturn(page);

        var result = controller.getUsers("ROLE_SELLER", "ACTIVE", "abc", 2, 20);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().data()).isEqualTo(page);
        verify(adminUserService).getUsers("ROLE_SELLER", "ACTIVE", "abc", 2, 20);
    }

    @Test
    void banUser_returnsOkAndDelegates() {
        when(adminUserService.banUser(TARGET_ID, ADMIN_ID)).thenReturn(res("BANNED"));

        var result = controller.banUser(ADMIN_ID, TARGET_ID);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().data().status()).isEqualTo("BANNED");
        verify(adminUserService).banUser(TARGET_ID, ADMIN_ID);
    }

    @Test
    void unbanUser_returnsOkAndDelegates() {
        when(adminUserService.unbanUser(TARGET_ID)).thenReturn(res("ACTIVE"));

        var result = controller.unbanUser(TARGET_ID);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().data().status()).isEqualTo("ACTIVE");
        verify(adminUserService).unbanUser(TARGET_ID);
    }
}
