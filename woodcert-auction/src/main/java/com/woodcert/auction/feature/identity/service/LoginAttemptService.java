package com.woodcert.auction.feature.identity.service;

import com.woodcert.auction.core.config.BruteForceProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Service managing user login attempts and locking.
 * Uses Redis to count failed attempts and store locked status.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LoginAttemptService {

    static final String ATTEMPT_KEY_PREFIX = "auth:failed_attempts:";
    static final String LOCK_KEY_PREFIX = "auth:locked:";

    private static final DefaultRedisScript<Long> RECORD_FAILURE_SCRIPT = new DefaultRedisScript<>("""
            local attemptKey = KEYS[1]
            local lockKey = KEYS[2]
            local maxAttempts = tonumber(ARGV[1])
            local ttlMillis = tonumber(ARGV[2])

            if redis.call('EXISTS', lockKey) == 1 then
                return -1
            end

            local attempts = redis.call('INCR', attemptKey)
            if attempts == 1 or redis.call('PTTL', attemptKey) < 0 then
                redis.call('PEXPIRE', attemptKey, ttlMillis)
            end

            if attempts >= maxAttempts then
                redis.call('SET', lockKey, 'locked', 'PX', ttlMillis)
                redis.call('DEL', attemptKey)
            end

            return attempts
            """, Long.class);

    private final StringRedisTemplate redisTemplate;
    private final BruteForceProperties bruteForceProperties;

    /**
     * Resets failed login attempts for the given email on successful login.
     *
     * @param email the normalized user email
     */
    public void loginSucceeded(String email) {
        try {
            redisTemplate.delete(getAttemptKey(email));
            log.debug("Login succeeded for email: {}, failed attempts reset", email);
        } catch (DataAccessException exception) {
            log.error("Redis unavailable while clearing failed login attempts for email: {}", email, exception);
        }
    }

    /**
     * Increments failed login attempts for the given email and locks the account
     * if the maximum attempts are reached.
     *
     * @param email the normalized user email
     */
    public void loginFailed(String email) {
        String attemptKey = getAttemptKey(email);
        String lockKey = getLockKey(email);
        long lockDurationSeconds = bruteForceProperties.getLockDurationSeconds();

        try {
            Long attempts = redisTemplate.execute(
                    RECORD_FAILURE_SCRIPT,
                    List.of(attemptKey, lockKey),
                    String.valueOf(bruteForceProperties.getMaxAttempts()),
                    String.valueOf(TimeUnit.SECONDS.toMillis(lockDurationSeconds)));

            if (attempts == null) {
                log.error("Redis returned no result while recording a failed login for email: {}", email);
                return;
            }
            if (attempts < 0) {
                log.debug("Ignored failed login counter update because email is already locked: {}", email);
                return;
            }

            log.warn("Failed login attempt count for email: {} is now {}", email, attempts);
            if (attempts >= bruteForceProperties.getMaxAttempts()) {
                log.warn("Email: {} has been temporarily locked for {} seconds due to {} failed attempts",
                        email, lockDurationSeconds, attempts);
            }
        } catch (DataAccessException exception) {
            log.error("Redis unavailable while recording a failed login for email: {}", email, exception);
        }
    }

    /**
     * Checks if the account associated with the given email is temporarily locked.
     *
     * @param email the normalized user email
     * @return true if locked, false otherwise
     */
    public boolean isBlocked(String email) {
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(getLockKey(email)));
        } catch (DataAccessException exception) {
            log.error("Redis unavailable while checking login lock for email: {}", email, exception);
            return false;
        }
    }

    private String getAttemptKey(String email) {
        return ATTEMPT_KEY_PREFIX + email;
    }

    private String getLockKey(String email) {
        return LOCK_KEY_PREFIX + email;
    }
}
