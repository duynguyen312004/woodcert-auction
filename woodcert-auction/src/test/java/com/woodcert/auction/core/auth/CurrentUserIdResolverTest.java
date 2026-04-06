package com.woodcert.auction.core.auth;

import com.woodcert.auction.core.exception.AppException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CurrentUserIdResolverTest {

    private final CurrentUserIdResolver resolver = new CurrentUserIdResolver();

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("supportsParameter returns true for @CurrentUserId String parameter")
    void supportsParameter_currentUserIdString_returnsTrue() throws NoSuchMethodException {
        MethodParameter parameter = methodParameter("annotatedString");

        assertTrue(resolver.supportsParameter(parameter));
    }

    @Test
    @DisplayName("supportsParameter returns false for plain String parameter")
    void supportsParameter_plainString_returnsFalse() throws NoSuchMethodException {
        MethodParameter parameter = methodParameter("plainString");

        assertFalse(resolver.supportsParameter(parameter));
    }

    @Test
    @DisplayName("resolveArgument returns JWT subject for authenticated user")
    void resolveArgument_jwtAuthentication_returnsSubject() throws NoSuchMethodException {
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "HS512")
                .subject("user-1")
                .build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt));

        Object result = resolver.resolveArgument(methodParameter("annotatedString"), null, null, null);

        assertEquals("user-1", result);
    }

    @Test
    @DisplayName("resolveArgument throws unauthorized when authentication is missing")
    void resolveArgument_missingAuthentication_throwsAppException() throws NoSuchMethodException {
        AppException exception = assertThrows(
                AppException.class,
                () -> resolver.resolveArgument(methodParameter("annotatedString"), null, null, null)
        );

        assertEquals("Unauthorized", exception.getMessage());
    }

    private MethodParameter methodParameter(String methodName) throws NoSuchMethodException {
        Method method = SampleController.class.getDeclaredMethod(methodName, String.class);
        return new MethodParameter(method, 0);
    }

    private static final class SampleController {

        @SuppressWarnings("unused")
        void annotatedString(@CurrentUserId String userId) {
        }

        @SuppressWarnings("unused")
        void plainString(String userId) {
        }
    }
}
