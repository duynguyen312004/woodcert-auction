package com.woodcert.auction.feature.auction.service;

import com.woodcert.auction.feature.auction.config.AuctionProperties;
import com.woodcert.auction.feature.auction.entity.AuctionSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

/**
 * Redis state management for active auction sessions.
 *
 * Per ACTIVE session, two keys are maintained:
 *   auction:session:{id}:state   — Hash with bid/time/price state
 *   auction:session:{id}:bidders — Set of registered bidder userIds (FROZEN participants)
 *
 * Redis is the live source of truth during ACTIVE status.
 * DB is the official record for terminal states (ENDED_*, CANCELED).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuctionRedisService {

    static final String STATE_KEY_PREFIX = "auction:session:";
    static final String STATE_SUFFIX = ":state";
    static final String BIDDERS_SUFFIX = ":bidders";

    // State hash field names — used by Lua script too (must stay in sync)
    public static final String FIELD_CURRENT_PRICE = "currentPrice";
    public static final String FIELD_STEP_PRICE = "stepPrice";
    public static final String FIELD_RESERVE_PRICE = "reservePrice";
    public static final String FIELD_END_TIME_EPOCH_MS = "endTimeEpochMs";
    public static final String FIELD_HIGHEST_BIDDER_ID = "highestBidderId";
    public static final String FIELD_HIGHEST_BID_TRACE_ID = "highestBidTraceId";
    public static final String FIELD_STATUS = "status";

    private static final DefaultRedisScript<Long> ADD_BIDDER_SCRIPT = new DefaultRedisScript<>("""
            local state = KEYS[1]
            local bidders = KEYS[2]
            local userId = ARGV[1]
            local nowMs = tonumber(ARGV[2])
            local retentionMs = tonumber(ARGV[3])

            local endTimeMs = tonumber(redis.call('HGET', state, 'endTimeEpochMs'))
            if endTimeMs == nil then
                return 0
            end

            if nowMs >= endTimeMs then
                return 0
            end

            redis.call('SADD', bidders, userId)
            redis.call('PEXPIRE', bidders, endTimeMs - nowMs + retentionMs)
            return 1
            """, Long.class);

    private final StringRedisTemplate redisTemplate;
    private final AuctionProperties auctionProperties;

    public String stateKey(Long auctionSessionId) {
        return STATE_KEY_PREFIX + auctionSessionId + STATE_SUFFIX;
    }

    public String biddersKey(Long auctionSessionId) {
        return STATE_KEY_PREFIX + auctionSessionId + BIDDERS_SUFFIX;
    }

    /**
     * Load session state and registered bidders into Redis.
     * Called by scheduler on activation.
     * TTL = (endTime - now) + retentionAfterEnd to ensure keys outlive the session.
     */
    public void loadSession(AuctionSession session, Set<String> frozenBidderIds) {
        Long id = session.getId();
        Instant now = Instant.now();
        Instant endTime = session.getEndTime();
        long endTimeEpochMs = endTime.toEpochMilli();
        long ttlSeconds = calculateTtlSeconds(endTime, now);

        Map<String, String> state = new HashMap<>();
        state.put(FIELD_CURRENT_PRICE, session.getCurrentPrice().toPlainString());
        state.put(FIELD_STEP_PRICE, session.getStepPrice().toPlainString());
        state.put(FIELD_RESERVE_PRICE, session.getReservePrice().toPlainString());
        state.put(FIELD_END_TIME_EPOCH_MS, String.valueOf(endTimeEpochMs));
        state.put(FIELD_HIGHEST_BIDDER_ID, "");
        state.put(FIELD_HIGHEST_BID_TRACE_ID, "");
        state.put(FIELD_STATUS, "ACTIVE");

        String stateKey = stateKey(id);
        String biddersKey = biddersKey(id);

        redisTemplate.opsForHash().putAll(stateKey, state);
        redisTemplate.expire(stateKey, ttlSeconds, TimeUnit.SECONDS);

        if (!frozenBidderIds.isEmpty()) {
            redisTemplate.opsForSet().add(biddersKey, frozenBidderIds.toArray(new String[0]));
            redisTemplate.expire(biddersKey, ttlSeconds, TimeUnit.SECONDS);
        }

        log.info("Loaded Redis state for auction session {} with TTL {}s and {} bidders",
                id, ttlSeconds, frozenBidderIds.size());
    }

    /**
     * Add a newly registered bidder to the Redis participant set.
     * Called during registration when session is already ACTIVE.
     */
    public boolean addBidder(Long auctionSessionId, String userId) {
        Instant now = Instant.now();
        Long result = redisTemplate.execute(
                ADD_BIDDER_SCRIPT,
                List.of(stateKey(auctionSessionId), biddersKey(auctionSessionId)),
                userId,
                String.valueOf(now.toEpochMilli()),
                String.valueOf(auctionProperties.getRedis().getStateRetentionAfterEnd().toMillis()));
        return Long.valueOf(1).equals(result);
    }

    /**
     * Get current price from Redis state hash.
     * Returns null if session state is not present (session ended or Redis evicted).
     */
    public String getCurrentPrice(Long auctionSessionId) {
        Object val = redisTemplate.opsForHash().get(stateKey(auctionSessionId), FIELD_CURRENT_PRICE);
        return val != null ? val.toString() : null;
    }

    /**
     * Get end time epoch ms from Redis state hash.
     */
    public Long getEndTimeEpochMs(Long auctionSessionId) {
        Object val = redisTemplate.opsForHash().get(stateKey(auctionSessionId), FIELD_END_TIME_EPOCH_MS);
        if (val == null) return null;
        try {
            return Long.parseLong(val.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Get current highest bidder id from Redis while a session is ACTIVE.
     */
    public String getHighestBidderId(Long auctionSessionId) {
        Object val = redisTemplate.opsForHash().get(stateKey(auctionSessionId), FIELD_HIGHEST_BIDDER_ID);
        if (val == null || val.toString().isBlank()) {
            return null;
        }
        return val.toString();
    }

    /**
     * Extend the Redis TTL after anti-sniper extends endTime.
     * Called after Lua script updates endTimeEpochMs in the hash.
     */
    public void extendTtl(Long auctionSessionId, Instant newEndTime) {
        long ttlSeconds = calculateTtlSeconds(newEndTime, Instant.now());
        redisTemplate.expire(stateKey(auctionSessionId), ttlSeconds, TimeUnit.SECONDS);
        redisTemplate.expire(biddersKey(auctionSessionId), ttlSeconds, TimeUnit.SECONDS);
    }

    /**
     * Check if session state exists in Redis.
     */
    public boolean sessionExists(Long auctionSessionId) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(stateKey(auctionSessionId)));
    }

    /**
     * Read the full state hash from Redis for close-session snapshot.
     */
    public Map<Object, Object> getSessionState(Long auctionSessionId) {
        return redisTemplate.opsForHash().entries(stateKey(auctionSessionId));
    }

    /**
     * Delete all Redis keys for a session after close-session finishes.
     */
    public void removeSession(Long auctionSessionId) {
        redisTemplate.delete(stateKey(auctionSessionId));
        redisTemplate.delete(biddersKey(auctionSessionId));
        log.info("Removed Redis state for auction session {}", auctionSessionId);
    }

    private long calculateTtlSeconds(Instant endTime, Instant now) {
        long retentionSeconds = auctionProperties.getRedis().getStateRetentionAfterEnd().getSeconds();
        long remaining = endTime.getEpochSecond() - now.getEpochSecond();
        return Math.max(remaining, 0) + retentionSeconds;
    }
}
