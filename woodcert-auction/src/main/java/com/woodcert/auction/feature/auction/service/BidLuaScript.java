package com.woodcert.auction.feature.auction.service;

import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

/**
 * Redis Lua script for atomic bid validation and update.
 *
 * KEYS[1] = state hash key (auction:session:{id}:state)
 * KEYS[2] = bidders set key  (auction:session:{id}:bidders)
 *
 * ARGV[1] = bidderId
 * ARGV[2] = bidAmount (plain string, 2 decimal places)
 * ARGV[3] = nowEpochMs (current time in milliseconds)
 * ARGV[4] = antiSniperThresholdMs
 * ARGV[5] = antiSniperExtensionMs
 * ARGV[6] = bidTraceId
 *
 * Returns: list of [resultCode, currentPrice, endTimeEpochMs]
 *   resultCode:
 *     "OK"            — bid accepted; currentPrice and endTimeEpochMs are updated values
 *     "ENDED"         — auction time has expired
 *     "LOW"           — bid amount is too low
 *     "NOT_REGISTERED"— bidder not in participant set
 *     "SELF_BID"      — bidder is already highest bidder (no-op self-improvement blocked)
 */
@Component
public class BidLuaScript {

    private static final String SCRIPT = """
            local state = KEYS[1]
            local bidders = KEYS[2]
            
            local bidderId      = ARGV[1]
            local bidAmount     = tonumber(ARGV[2])
            local nowMs         = tonumber(ARGV[3])
            local sniperThMs    = tonumber(ARGV[4])
            local sniperExtMs   = tonumber(ARGV[5])
            local bidTraceId    = ARGV[6]
            
            -- Read state
            local currentPrice   = tonumber(redis.call('HGET', state, 'currentPrice'))
            local stepPrice      = tonumber(redis.call('HGET', state, 'stepPrice'))
            local endTimeMs      = tonumber(redis.call('HGET', state, 'endTimeEpochMs'))
            local highestBidder  = redis.call('HGET', state, 'highestBidderId')
            
            -- 1) Check time
            if nowMs >= endTimeMs then
                return {'ENDED', tostring(currentPrice), tostring(endTimeMs)}
            end
            
            -- 2) Check registered bidder
            if redis.call('SISMEMBER', bidders, bidderId) == 0 then
                return {'NOT_REGISTERED', tostring(currentPrice), tostring(endTimeMs)}
            end
            
            -- 3) Check not self-bidding (already highest)
            if highestBidder == bidderId then
                return {'SELF_BID', tostring(currentPrice), tostring(endTimeMs)}
            end
            
            -- 4) Validate minimum bid
            if bidAmount < (currentPrice + stepPrice) then
                return {'LOW', tostring(currentPrice), tostring(endTimeMs)}
            end
            
            -- 5) Accept bid: update price and highest bidder
            redis.call('HSET', state, 'currentPrice', tostring(bidAmount))
            redis.call('HSET', state, 'highestBidderId', bidderId)
            redis.call('HSET', state, 'highestBidTraceId', bidTraceId)
            
            -- 6) Anti-sniper: extend end time if within threshold
            local remainingMs = endTimeMs - nowMs
            if remainingMs <= sniperThMs then
                endTimeMs = endTimeMs + sniperExtMs
                redis.call('HSET', state, 'endTimeEpochMs', tostring(endTimeMs))
            end
            
            return {'OK', tostring(bidAmount), tostring(endTimeMs)}
            """;

    private final DefaultRedisScript<List<Object>> redisScript;

    @SuppressWarnings("unchecked")
    public BidLuaScript() {
        DefaultRedisScript<List<Object>> script = new DefaultRedisScript<>();
        script.setScriptText(SCRIPT);
        script.setResultType((Class<List<Object>>) (Class<?>) List.class);
        this.redisScript = script;
    }

    public DefaultRedisScript<List<Object>> getScript() {
        return redisScript;
    }

    public List<String> buildKeys(Long auctionSessionId) {
        return Arrays.asList(
                AuctionRedisService.STATE_KEY_PREFIX + auctionSessionId + AuctionRedisService.STATE_SUFFIX,
                AuctionRedisService.STATE_KEY_PREFIX + auctionSessionId + AuctionRedisService.BIDDERS_SUFFIX
        );
    }
}
