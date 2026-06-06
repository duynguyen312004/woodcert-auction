package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.core.config.BruteForceProperties;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Testcontainers(disabledWithoutDocker = true)
class LoginAttemptServiceRedisIntegrationTest {

    @SuppressWarnings("resource")
    @Container
    private static final GenericContainer<?> REDIS = new GenericContainer<>("redis:7.0-alpine")
            .withExposedPorts(6379);

    private static LettuceConnectionFactory connectionFactory;
    private static StringRedisTemplate redisTemplate;

    private LoginAttemptService loginAttemptService;

    @BeforeAll
    static void startRedis() {
        connectionFactory = new LettuceConnectionFactory(REDIS.getHost(), REDIS.getMappedPort(6379));
        connectionFactory.afterPropertiesSet();
        redisTemplate = new StringRedisTemplate(connectionFactory);
        redisTemplate.afterPropertiesSet();
    }

    @AfterAll
    static void stopRedis() {
        if (connectionFactory != null) {
            connectionFactory.destroy();
        }
    }

    @BeforeEach
    void setUp() {
        redisTemplate.getConnectionFactory().getConnection().serverCommands().flushDb();

        BruteForceProperties properties = new BruteForceProperties();
        properties.setMaxAttempts(5);
        properties.setLockDurationSeconds(2);
        loginAttemptService = new LoginAttemptService(redisTemplate, properties);
    }

    @Test
    void firstFailureCreatesExpiringAttemptCounter() {
        String email = "ttl@example.com";

        loginAttemptService.loginFailed(email);

        String attemptKey = LoginAttemptService.ATTEMPT_KEY_PREFIX + email;
        assertNotNull(redisTemplate.opsForValue().get(attemptKey));
        Long ttl = redisTemplate.getExpire(attemptKey, TimeUnit.MILLISECONDS);
        assertNotNull(ttl);
        assertTrue(ttl > 0 && ttl <= 2000);
    }

    @Test
    void fifthFailureAtomicallyCreatesTemporaryLockAndClearsCounter() {
        String email = "locked@example.com";

        for (int attempt = 0; attempt < 5; attempt++) {
            loginAttemptService.loginFailed(email);
        }

        String attemptKey = LoginAttemptService.ATTEMPT_KEY_PREFIX + email;
        String lockKey = LoginAttemptService.LOCK_KEY_PREFIX + email;
        assertTrue(loginAttemptService.isBlocked(email));
        assertNull(redisTemplate.opsForValue().get(attemptKey));

        Long ttl = redisTemplate.getExpire(lockKey, TimeUnit.MILLISECONDS);
        assertNotNull(ttl);
        assertTrue(ttl > 0 && ttl <= 2000);
    }

    @Test
    void lockExpiresAndAllowsAnotherLoginAttemptWindow() throws InterruptedException {
        String email = "expires@example.com";
        for (int attempt = 0; attempt < 5; attempt++) {
            loginAttemptService.loginFailed(email);
        }

        assertTrue(loginAttemptService.isBlocked(email));

        Thread.sleep(2200);

        assertFalse(loginAttemptService.isBlocked(email));
    }
}
