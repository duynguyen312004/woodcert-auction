package com.woodcert.auction.integration;

import com.woodcert.auction.feature.auction.entity.AuctionSession;
import com.woodcert.auction.feature.auction.entity.AuctionSessionStatus;
import com.woodcert.auction.feature.auction.service.AuctionRedisService;
import com.woodcert.auction.feature.auction.service.BidLuaScript;
import com.woodcert.auction.feature.catalog.entity.Product;
import com.woodcert.auction.feature.identity.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class BidLuaRuntimeIntegrationTest extends AuctionIntegrationTestBase {

    @Autowired private AuctionRedisService auctionRedisService;
    @Autowired private BidLuaScript bidLuaScript;

    @Test
    void luaAcceptsValidRegisteredBidAndUpdatesRuntimeState() {
        AuctionSession session = activeRuntimeSession(Instant.now().plusSeconds(3600), Set.of("bidder-1"));

        List<Object> result = executeLua(session.getId(), "bidder-1", new BigDecimal("10100000.00"), "trace-1");

        assertThat(result.get(0).toString()).isEqualTo("OK");
        assertThat(result.get(3).toString()).isEqualTo("0");
        assertThat(new BigDecimal(auctionRedisService.getCurrentPrice(session.getId())))
                .isEqualByComparingTo("10100000.00");
        assertThat(redisTemplate.opsForHash().get(auctionRedisService.stateKey(session.getId()), AuctionRedisService.FIELD_HIGHEST_BIDDER_ID))
                .isEqualTo("bidder-1");
        assertThat(redisTemplate.opsForHash().get(auctionRedisService.stateKey(session.getId()), AuctionRedisService.FIELD_HIGHEST_BID_TRACE_ID))
                .isEqualTo("trace-1");
    }

    @Test
    void luaRejectsUnregisteredLowExpiredAndHighestBidderRebid() {
        AuctionSession session = activeRuntimeSession(Instant.now().plusSeconds(3600), Set.of("bidder-1", "bidder-2"));

        assertThat(executeLua(session.getId(), "not-registered", new BigDecimal("10100000.00"), "trace-x").get(0).toString())
                .isEqualTo("NOT_REGISTERED");
        assertThat(executeLua(session.getId(), "bidder-1", new BigDecimal("10050000.00"), "trace-low").get(0).toString())
                .isEqualTo("LOW");

        assertThat(executeLua(session.getId(), "bidder-1", new BigDecimal("10100000.00"), "trace-ok").get(0).toString())
                .isEqualTo("OK");
        assertThat(executeLua(session.getId(), "bidder-1", new BigDecimal("10200000.00"), "trace-self").get(0).toString())
                .isEqualTo("SELF_BID");

        redisTemplate.opsForHash().put(
                auctionRedisService.stateKey(session.getId()),
                AuctionRedisService.FIELD_END_TIME_EPOCH_MS,
                String.valueOf(Instant.now().minusSeconds(1).toEpochMilli()));
        assertThat(executeLua(session.getId(), "bidder-2", new BigDecimal("10200000.00"), "trace-ended").get(0).toString())
                .isEqualTo("ENDED");
    }

    @Test
    void luaExtendsEndTimeWhenBidIsInsideAntiSniperWindow() {
        Instant originalEndTime = Instant.now().plusSeconds(20);
        AuctionSession session = activeRuntimeSession(originalEndTime, Set.of("bidder-1"));

        List<Object> result = executeLua(session.getId(), "bidder-1", new BigDecimal("10100000.00"), "trace-sniper");

        assertThat(result.get(0).toString()).isEqualTo("OK");
        long newEndTimeMs = Long.parseLong(result.get(2).toString());
        long extendedByMs = Long.parseLong(result.get(3).toString());
        assertThat(newEndTimeMs).isEqualTo(originalEndTime.toEpochMilli() + 60_000L);
        assertThat(extendedByMs).isEqualTo(60_000L);
        assertThat(auctionRedisService.getEndTimeEpochMs(session.getId())).isEqualTo(newEndTimeMs);
    }

    private AuctionSession activeRuntimeSession(Instant endTime, Set<String> bidders) {
        User seller = createSeller("seller-lua-" + System.nanoTime() + "@example.com");
        Product product = createAppraisedProduct(seller.getId());
        AuctionSession session = createSession(
                product,
                AuctionSessionStatus.ACTIVE,
                Instant.now().minusSeconds(60),
                endTime,
                new BigDecimal("12000000.00"));
        auctionRedisService.loadSession(session, bidders);
        return session;
    }

    private List<Object> executeLua(Long auctionId, String bidderId, BigDecimal amount, String traceId) {
        return redisTemplate.execute(
                bidLuaScript.getScript(),
                bidLuaScript.buildKeys(auctionId),
                bidderId,
                amount.toPlainString(),
                String.valueOf(Instant.now().toEpochMilli()),
                String.valueOf(30_000L),
                String.valueOf(60_000L),
                traceId);
    }
}
