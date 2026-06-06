package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.core.config.BruteForceProperties;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LoginAttemptServiceTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private BruteForceProperties bruteForceProperties;

    @InjectMocks
    private LoginAttemptService loginAttemptService;

    @Test
    @DisplayName("loginSucceeded deletes failed attempts key")
    void loginSucceeded_deletesAttemptKey() {
        String email = "user@example.com";

        loginAttemptService.loginSucceeded(email);

        verify(redisTemplate).delete("auth:failed_attempts:" + email);
    }

    @Test
    @SuppressWarnings("unchecked")
    @DisplayName("loginFailed executes the atomic Redis script with configured limits")
    void loginFailed_executesAtomicScript() {
        configureProperties();
        String email = "user@example.com";
        List<String> keys = List.of(
                "auth:failed_attempts:" + email,
                "auth:locked:" + email);
        when(redisTemplate.execute(
                any(RedisScript.class),
                eq(keys),
                eq("5"),
                eq("900000")))
                .thenReturn(1L);

        loginAttemptService.loginFailed(email);

        verify(redisTemplate).execute(
                any(RedisScript.class),
                eq(keys),
                eq("5"),
                eq("900000"));
    }

    @Test
    @SuppressWarnings("unchecked")
    @DisplayName("loginFailed accepts the script result when max attempts creates the lock")
    void loginFailed_maxAttemptsReached_completesNormally() {
        configureProperties();
        String email = "user@example.com";
        when(redisTemplate.execute(
                any(RedisScript.class),
                any(List.class),
                eq("5"),
                eq("900000")))
                .thenReturn(5L);

        assertDoesNotThrow(() -> loginAttemptService.loginFailed(email));
    }

    @Test
    @DisplayName("isBlocked returns true when lock key exists in Redis")
    void isBlocked_returnsTrueWhenLockKeyExists() {
        String email = "user@example.com";
        when(redisTemplate.hasKey("auth:locked:" + email)).thenReturn(true);

        boolean result = loginAttemptService.isBlocked(email);

        assertTrue(result);
    }

    @Test
    @DisplayName("isBlocked returns false when lock key does not exist")
    void isBlocked_returnsFalseWhenLockKeyDoesNotExist() {
        String email = "user@example.com";
        when(redisTemplate.hasKey("auth:locked:" + email)).thenReturn(false);

        boolean result = loginAttemptService.isBlocked(email);

        assertFalse(result);
    }

    @Test
    @DisplayName("Redis outage does not prevent successful login cleanup")
    void loginSucceeded_redisUnavailable_failsOpen() {
        String email = "user@example.com";
        when(redisTemplate.delete("auth:failed_attempts:" + email))
                .thenThrow(new RedisConnectionFailureException("Redis unavailable"));

        assertDoesNotThrow(() -> loginAttemptService.loginSucceeded(email));
    }

    @Test
    @SuppressWarnings("unchecked")
    @DisplayName("Redis outage does not replace the invalid credentials response")
    void loginFailed_redisUnavailable_failsOpen() {
        configureProperties();
        when(redisTemplate.execute(
                any(RedisScript.class),
                any(List.class),
                eq("5"),
                eq("900000")))
                .thenThrow(new RedisConnectionFailureException("Redis unavailable"));

        assertDoesNotThrow(() -> loginAttemptService.loginFailed("user@example.com"));
    }

    @Test
    @DisplayName("Redis outage treats the account as not blocked")
    void isBlocked_redisUnavailable_failsOpen() {
        String email = "user@example.com";
        when(redisTemplate.hasKey("auth:locked:" + email))
                .thenThrow(new RedisConnectionFailureException("Redis unavailable"));

        assertFalse(loginAttemptService.isBlocked(email));
    }

    private void configureProperties() {
        when(bruteForceProperties.getMaxAttempts()).thenReturn(5);
        when(bruteForceProperties.getLockDurationSeconds()).thenReturn(900L);
    }
}
