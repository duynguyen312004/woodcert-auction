package com.woodcert.auction.integration;

import com.woodcert.auction.feature.auction.entity.AuctionSession;
import com.woodcert.auction.feature.auction.entity.AuctionSessionStatus;
import com.woodcert.auction.feature.auction.service.AuctionRedisService;
import com.woodcert.auction.feature.catalog.entity.Product;
import com.woodcert.auction.feature.identity.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Set;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

class AuctionRedisServiceIntegrationTest extends AuctionIntegrationTestBase {

    @Autowired
    private AuctionRedisService auctionRedisService;

    @Test
    void loadSession_writesStateAndBiddersWithTtl() {
        User seller = createSeller("seller-redis@example.com");
        Product product = createAppraisedProduct(seller.getId());
        AuctionSession session = createSession(
                product,
                AuctionSessionStatus.ACTIVE,
                Instant.now().minusSeconds(60),
                Instant.now().plusSeconds(3600),
                new BigDecimal("12000000.00"));

        auctionRedisService.loadSession(session, Set.of("bidder-1", "bidder-2"));

        assertThat(auctionRedisService.getCurrentPrice(session.getId())).isEqualTo("10000000.00");
        assertThat(auctionRedisService.getEndTimeEpochMs(session.getId())).isEqualTo(session.getEndTime().toEpochMilli());
        assertThat(redisTemplate.opsForSet().isMember(auctionRedisService.biddersKey(session.getId()), "bidder-1")).isTrue();
        assertThat(redisTemplate.getExpire(auctionRedisService.stateKey(session.getId()), TimeUnit.SECONDS)).isPositive();
        assertThat(redisTemplate.getExpire(auctionRedisService.biddersKey(session.getId()), TimeUnit.SECONDS)).isPositive();
    }

    @Test
    void addBidder_succeedsOnlyWhileRuntimeEndTimeIsValid() {
        User seller = createSeller("seller-add-bidder@example.com");
        Product product = createAppraisedProduct(seller.getId());
        AuctionSession session = createSession(
                product,
                AuctionSessionStatus.ACTIVE,
                Instant.now().minusSeconds(60),
                Instant.now().plusSeconds(600),
                new BigDecimal("12000000.00"));
        auctionRedisService.loadSession(session, Set.of());

        assertThat(auctionRedisService.addBidder(session.getId(), "bidder-1")).isTrue();
        assertThat(redisTemplate.opsForSet().isMember(auctionRedisService.biddersKey(session.getId()), "bidder-1")).isTrue();

        redisTemplate.opsForHash().put(
                auctionRedisService.stateKey(session.getId()),
                AuctionRedisService.FIELD_END_TIME_EPOCH_MS,
                String.valueOf(Instant.now().minusSeconds(1).toEpochMilli()));

        assertThat(auctionRedisService.addBidder(session.getId(), "late-bidder")).isFalse();
        assertThat(redisTemplate.opsForSet().isMember(auctionRedisService.biddersKey(session.getId()), "late-bidder")).isFalse();
    }

    @Test
    void extendTtl_keepsStateAndBidderKeysAlive() {
        User seller = createSeller("seller-ttl@example.com");
        Product product = createAppraisedProduct(seller.getId());
        AuctionSession session = createSession(
                product,
                AuctionSessionStatus.ACTIVE,
                Instant.now().minusSeconds(60),
                Instant.now().plusSeconds(60),
                new BigDecimal("12000000.00"));
        auctionRedisService.loadSession(session, Set.of("bidder-1"));

        auctionRedisService.extendTtl(session.getId(), Instant.now().plusSeconds(3600));

        assertThat(redisTemplate.getExpire(auctionRedisService.stateKey(session.getId()), TimeUnit.SECONDS)).isGreaterThan(3500L);
        assertThat(redisTemplate.getExpire(auctionRedisService.biddersKey(session.getId()), TimeUnit.SECONDS)).isGreaterThan(3500L);
    }

    @Test
    void removeSession_deletesStateAndBidderKeys() {
        User seller = createSeller("seller-remove@example.com");
        Product product = createAppraisedProduct(seller.getId());
        AuctionSession session = createSession(
                product,
                AuctionSessionStatus.ACTIVE,
                Instant.now().minusSeconds(60),
                Instant.now().plusSeconds(600),
                new BigDecimal("12000000.00"));
        auctionRedisService.loadSession(session, Set.of("bidder-1"));

        auctionRedisService.removeSession(session.getId());

        assertThat(Boolean.TRUE.equals(redisTemplate.hasKey(auctionRedisService.stateKey(session.getId())))).isFalse();
        assertThat(Boolean.TRUE.equals(redisTemplate.hasKey(auctionRedisService.biddersKey(session.getId())))).isFalse();
    }
}
