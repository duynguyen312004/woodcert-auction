package com.woodcert.auction.feature.identity.controller;

import com.woodcert.auction.core.config.RefreshCookieProperties;
import com.woodcert.auction.feature.identity.service.AuthService;
import com.woodcert.auction.feature.identity.service.RotatedAuthTokens;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock private AuthService authService;

    private AuthController controller;

    @BeforeEach
    void setUp() {
        RefreshCookieProperties cookieProperties = new RefreshCookieProperties();
        cookieProperties.setSecure(false);
        controller = new AuthController(authService, cookieProperties);
    }

    @Test
    void refresh_withCookieRefreshRequiresMatchingCsrfToken() {
        MockHttpServletResponse response = new MockHttpServletResponse();

        var result = controller.refresh("refresh-token", "csrf-cookie", null, response);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(authService, never()).refresh("refresh-token");
    }

    @Test
    void refresh_withCookieRefreshAndMatchingCsrfRotatesToken() {
        MockHttpServletResponse response = new MockHttpServletResponse();
        when(authService.refresh("refresh-token"))
                .thenReturn(new RotatedAuthTokens("access-token", "new-refresh-token"));

        var result = controller.refresh("refresh-token", "csrf-token", "csrf-token", response);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders("Set-Cookie"))
                .anySatisfy(cookie -> assertThat(cookie).contains("refresh_token=new-refresh-token"));
        verify(authService).refresh("refresh-token");
    }

    @Test
    void refresh_withoutCookieReturnsUnauthorized() {
        MockHttpServletResponse response = new MockHttpServletResponse();

        var result = controller.refresh(null, "csrf-token", "csrf-token", response);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
