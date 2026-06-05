package com.woodcert.auction.integration;

import com.woodcert.auction.feature.auction.config.AuctionProperties;
import com.woodcert.auction.feature.auction.dto.request.CreateAuctionSessionReq;
import com.woodcert.auction.feature.auction.dto.request.CreateBidReq;
import com.woodcert.auction.feature.auction.entity.AuctionSession;
import com.woodcert.auction.feature.auction.entity.AuctionSessionStatus;
import com.woodcert.auction.feature.auction.entity.BidStatus;
import com.woodcert.auction.feature.auction.entity.DepositStatus;
import com.woodcert.auction.feature.auction.service.AuctionRedisService;
import com.woodcert.auction.feature.auction.service.AuctionSessionScheduler;
import com.woodcert.auction.feature.catalog.entity.Product;
import com.woodcert.auction.feature.catalog.entity.ProductSaleStatus;
import com.woodcert.auction.feature.identity.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuctionRuntimeFlowIntegrationTest extends AuctionIntegrationTestBase {

        @Autowired
        private AuctionRedisService auctionRedisService;
        @Autowired
        private AuctionSessionScheduler auctionSessionScheduler;
        @Autowired
        private AuctionProperties auctionProperties;

        @Test
        void sellerCreatesAuctionOnlyForOwnedAppraisedProduct() throws Exception {
                User seller = createSeller("seller-create@example.com");
                Product product = createAppraisedProduct(seller.getId());

                mockMvc.perform(post("/api/v1/auctions")
                                .with(jwt().jwt(jwt -> jwt.subject(seller.getId()))
                                                .authorities(authorities("CREATE_AUCTION_SESSION")))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(createRequest(product.getId()))))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.data.status").value("WAITING"))
                                .andExpect(jsonPath("$.data.product.id").value(product.getId()));

                assertThat(auctionSessionRepository.findAll()).hasSize(1);

                User otherSeller = createSeller("seller-other@example.com");
                Product otherProduct = createAppraisedProduct(otherSeller.getId());
                mockMvc.perform(post("/api/v1/auctions")
                                .with(jwt().jwt(jwt -> jwt.subject(seller.getId()))
                                                .authorities(authorities("CREATE_AUCTION_SESSION")))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(createRequest(otherProduct.getId()))))
                                .andExpect(status().isForbidden());
        }

        @Test
        void duplicateOpenSessionForSameProductIsRejected() throws Exception {
                User seller = createSeller("seller-duplicate@example.com");
                Product product = createAppraisedProduct(seller.getId());
                createSession(product, AuctionSessionStatus.WAITING, Instant.now().plusSeconds(3600),
                                Instant.now().plusSeconds(7200), new BigDecimal("12000000.00"));

                mockMvc.perform(post("/api/v1/auctions")
                                .with(jwt().jwt(jwt -> jwt.subject(seller.getId()))
                                                .authorities(authorities("CREATE_AUCTION_SESSION")))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(createRequest(product.getId()))))
                                .andExpect(status().isConflict());
        }

        @Test
        void publicListAndDetailExposeVisibleSessionsAndHideReservePrice() throws Exception {
                User seller = createSeller("seller-public@example.com");
                Product product = createAppraisedProduct(seller.getId());
                AuctionSession waiting = createSession(product, AuctionSessionStatus.WAITING,
                                Instant.now().plusSeconds(3600), Instant.now().plusSeconds(7200),
                                new BigDecimal("15000000.00"));

                mockMvc.perform(get("/api/v1/auctions"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.result[0].id").value(waiting.getId()))
                                .andExpect(jsonPath("$.data.result[0].status").value("WAITING"));

                mockMvc.perform(get("/api/v1/auctions/{id}", waiting.getId()))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.id").value(waiting.getId()))
                                .andExpect(jsonPath("$.data.reservePrice").doesNotExist());
        }

        @Test
        void buyerRegistrationFreezesWalletAndCreatesFrozenParticipant() throws Exception {
                User seller = createSeller("seller-register@example.com");
                User bidder = createUser("bidder-register@example.com");
                createWallet(bidder.getId(), new BigDecimal("5000000.00"), BigDecimal.ZERO);
                Product product = createAppraisedProduct(seller.getId());
                AuctionSession session = createSession(product, AuctionSessionStatus.WAITING,
                                Instant.now().plusSeconds(3600), Instant.now().plusSeconds(7200),
                                new BigDecimal("12000000.00"));

                mockMvc.perform(post("/api/v1/auctions/{id}/register", session.getId())
                                .with(jwt().jwt(jwt -> jwt.subject(bidder.getId()))
                                                .authorities(authorities("REGISTER_AUCTION"))))
                                .andExpect(status().isOk());

                var wallet = walletRepository.findByUserId(bidder.getId()).orElseThrow();
                assertThat(wallet.getAvailableBalance()).isEqualByComparingTo("4000000.00");
                assertThat(wallet.getFrozenBalance()).isEqualByComparingTo("1000000.00");
                var participant = auctionParticipantRepository
                                .findByAuctionSessionIdAndUserId(session.getId(), bidder.getId()).orElseThrow();
                assertThat(participant.getDepositStatus()).isEqualTo(DepositStatus.FROZEN);
        }

        @Test
        void cancelWaitingAuctionRefundsFrozenDepositsAndReopensProduct() throws Exception {
                User seller = createSeller("seller-cancel@example.com");
                User bidder = createUser("bidder-cancel@example.com");
                createWallet(bidder.getId(), new BigDecimal("5000000.00"), BigDecimal.ZERO);
                Product product = createAppraisedProduct(seller.getId());
                AuctionSession session = createSession(product, AuctionSessionStatus.WAITING,
                                Instant.now().plusSeconds(3600), Instant.now().plusSeconds(7200),
                                new BigDecimal("12000000.00"));

                mockMvc.perform(post("/api/v1/auctions/{id}/register", session.getId())
                                .with(jwt().jwt(jwt -> jwt.subject(bidder.getId()))
                                                .authorities(authorities("REGISTER_AUCTION"))))
                                .andExpect(status().isOk());

                mockMvc.perform(patch("/api/v1/auctions/{id}/cancel", session.getId())
                                .with(jwt().jwt(jwt -> jwt.subject(seller.getId()))
                                                .authorities(authorities("CREATE_AUCTION_SESSION"))))
                                .andExpect(status().isOk());

                AuctionSession canceled = auctionSessionRepository.findById(session.getId()).orElseThrow();
                assertThat(canceled.getStatus()).isEqualTo(AuctionSessionStatus.CANCELED);
                assertThat(productRepository.findById(product.getId()).orElseThrow().getSaleStatus())
                                .isEqualTo(ProductSaleStatus.AVAILABLE);

                var participant = auctionParticipantRepository
                                .findByAuctionSessionIdAndUserId(session.getId(), bidder.getId()).orElseThrow();
                assertThat(participant.getDepositStatus()).isEqualTo(DepositStatus.REFUNDED);

                var wallet = walletRepository.findByUserId(bidder.getId()).orElseThrow();
                assertThat(wallet.getAvailableBalance()).isEqualByComparingTo("5000000.00");
                assertThat(wallet.getFrozenBalance()).isEqualByComparingTo("0.00");
        }

        @Test
        void activeLateRegistrationAddsBidderToRedisAfterDepositFreeze() throws Exception {
                User seller = createSeller("seller-late-register@example.com");
                User bidder = createUser("bidder-late-register@example.com");
                createWallet(bidder.getId(), new BigDecimal("5000000.00"), BigDecimal.ZERO);
                Product product = createAppraisedProduct(seller.getId());
                AuctionSession session = createSession(product, AuctionSessionStatus.ACTIVE,
                                Instant.now().minusSeconds(60), Instant.now().plusSeconds(7200),
                                new BigDecimal("12000000.00"));
                auctionRedisService.loadSession(session, Set.of());

                mockMvc.perform(post("/api/v1/auctions/{id}/register", session.getId())
                                .with(jwt().jwt(jwt -> jwt.subject(bidder.getId()))
                                                .authorities(authorities("REGISTER_AUCTION"))))
                                .andExpect(status().isOk());

                assertThat(redisTemplate.opsForSet().isMember(auctionRedisService.biddersKey(session.getId()),
                                bidder.getId())).isTrue();
                var wallet = walletRepository.findByUserId(bidder.getId()).orElseThrow();
                assertThat(wallet.getFrozenBalance()).isEqualByComparingTo("1000000.00");
        }

        @Test
        void registeredBidderPlacesBidAndRuntimeDbAuditStayConsistent() throws Exception {
                User seller = createSeller("seller-bid@example.com");
                User bidder = createUser("bidder-bid@example.com");
                Product product = createAppraisedProduct(seller.getId());
                AuctionSession session = createSession(product, AuctionSessionStatus.ACTIVE,
                                Instant.now().minusSeconds(60), Instant.now().plusSeconds(7200),
                                new BigDecimal("12000000.00"));
                createParticipant(session.getId(), bidder.getId(), new BigDecimal("1000000.00"));
                auctionRedisService.loadSession(session, Set.of(bidder.getId()));

                mockMvc.perform(post("/api/v1/bids")
                                .with(jwt().jwt(jwt -> jwt.subject(bidder.getId()))
                                                .authorities(authorities("CREATE_BID")))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(
                                                new CreateBidReq(session.getId(), new BigDecimal("10100000.00")))))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.currentPrice").value(10100000.00));

                assertThat(new BigDecimal(auctionRedisService.getCurrentPrice(session.getId())))
                                .isEqualByComparingTo("10100000.00");
                assertThat(bidRepository.findAll()).hasSize(1);
                assertThat(bidRepository.findAll().get(0).getStatus()).isEqualTo(BidStatus.VALID);
                AuctionSession reloaded = auctionSessionRepository.findById(session.getId()).orElseThrow();
                assertThat(reloaded.getCurrentPrice()).isEqualByComparingTo("10100000.00");
                assertThat(reloaded.getHighestBidderId()).isEqualTo(bidder.getId());
        }

        @Test
        void schedulerActivationLoadsRedisBeforeSwitchingDbStatusToActive() {
                User seller = createSeller("seller-activate@example.com");
                User bidder = createUser("bidder-activate@example.com");
                Product product = createAppraisedProduct(seller.getId());
                AuctionSession session = createSession(product, AuctionSessionStatus.WAITING,
                                Instant.now().minusSeconds(60), Instant.now().plusSeconds(7200),
                                new BigDecimal("12000000.00"));
                createParticipant(session.getId(), bidder.getId(), new BigDecimal("1000000.00"));

                runSchedulerEnabled(() -> auctionSessionScheduler.activateDueSessions());

                AuctionSession reloaded = auctionSessionRepository.findById(session.getId()).orElseThrow();
                assertThat(reloaded.getStatus()).isEqualTo(AuctionSessionStatus.ACTIVE);
                assertThat(auctionRedisService.sessionExists(session.getId())).isTrue();
                assertThat(redisTemplate.opsForSet().isMember(auctionRedisService.biddersKey(session.getId()),
                                bidder.getId())).isTrue();
        }

        @Test
        void schedulerCloseSuccessDeductsWinnerRefundsLosersAndRemovesRedis() throws Exception {
                User seller = createSeller("seller-close-success@example.com");
                User winner = createUser("winner-close-success@example.com");
                User loser = createUser("loser-close-success@example.com");
                createWallet(winner.getId(), BigDecimal.ZERO, new BigDecimal("1000000.00"));
                createWallet(loser.getId(), BigDecimal.ZERO, new BigDecimal("1000000.00"));
                Product product = createAppraisedProduct(seller.getId());
                AuctionSession session = createSession(product, AuctionSessionStatus.ACTIVE,
                                Instant.now().minusSeconds(3600), Instant.now().plusSeconds(7200),
                                new BigDecimal("10100000.00"));
                createParticipant(session.getId(), winner.getId(), new BigDecimal("1000000.00"));
                createParticipant(session.getId(), loser.getId(), new BigDecimal("1000000.00"));
                auctionRedisService.loadSession(session, Set.of(winner.getId(), loser.getId()));

                mockMvc.perform(post("/api/v1/bids")
                                .with(jwt().jwt(jwt -> jwt.subject(winner.getId()))
                                                .authorities(authorities("CREATE_BID")))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(
                                                new CreateBidReq(session.getId(), new BigDecimal("10100000.00")))))
                                .andExpect(status().isOk());

                forceRuntimeEnd(session.getId());
                runSchedulerEnabled(() -> auctionSessionScheduler.closeDueSessions());

                AuctionSession closed = auctionSessionRepository.findById(session.getId()).orElseThrow();
                assertThat(closed.getStatus()).isEqualTo(AuctionSessionStatus.ENDED_SUCCESS);
                assertThat(closed.getHighestBidderId()).isEqualTo(winner.getId());
                assertThat(auctionParticipantRepository.findByAuctionSessionIdAndUserId(session.getId(), winner.getId())
                                .orElseThrow().getDepositStatus())
                                .isEqualTo(DepositStatus.DEDUCTED);
                assertThat(auctionParticipantRepository.findByAuctionSessionIdAndUserId(session.getId(), loser.getId())
                                .orElseThrow().getDepositStatus())
                                .isEqualTo(DepositStatus.REFUNDED);
                assertThat(walletRepository.findByUserId(winner.getId()).orElseThrow().getFrozenBalance())
                                .isEqualByComparingTo("0.00");
                assertThat(walletRepository.findByUserId(loser.getId()).orElseThrow().getAvailableBalance())
                                .isEqualByComparingTo("1000000.00");
                assertThat(auctionRedisService.sessionExists(session.getId())).isFalse();
        }

        @Test
        void schedulerCloseFailedWhenReserveNotMetRefundsAllParticipants() {
                User seller = createSeller("seller-close-failed@example.com");
                User bidder = createUser("bidder-close-failed@example.com");
                createWallet(bidder.getId(), BigDecimal.ZERO, new BigDecimal("1000000.00"));
                Product product = createAppraisedProduct(seller.getId());
                AuctionSession session = createSession(product, AuctionSessionStatus.ACTIVE,
                                Instant.now().minusSeconds(3600), Instant.now().minusSeconds(60),
                                new BigDecimal("15000000.00"));
                createParticipant(session.getId(), bidder.getId(), new BigDecimal("1000000.00"));
                auctionRedisService.loadSession(session, Set.of(bidder.getId()));
                forceRuntimeEnd(session.getId());

                runSchedulerEnabled(() -> auctionSessionScheduler.closeDueSessions());

                AuctionSession closed = auctionSessionRepository.findById(session.getId()).orElseThrow();
                assertThat(closed.getStatus()).isEqualTo(AuctionSessionStatus.ENDED_FAILED);
                assertThat(auctionParticipantRepository.findByAuctionSessionIdAndUserId(session.getId(), bidder.getId())
                                .orElseThrow().getDepositStatus())
                                .isEqualTo(DepositStatus.REFUNDED);
                assertThat(walletRepository.findByUserId(bidder.getId()).orElseThrow().getAvailableBalance())
                                .isEqualByComparingTo("1000000.00");
                assertThat(auctionRedisService.sessionExists(session.getId())).isFalse();
        }

        private CreateAuctionSessionReq createRequest(Long productId) {
                return new CreateAuctionSessionReq(
                                productId,
                                new BigDecimal("10000000.00"),
                                new BigDecimal("12000000.00"),
                                new BigDecimal("100000.00"),
                                new BigDecimal("1000000.00"),
                                Instant.now().plusSeconds(3600),
                                Instant.now().plusSeconds(7200));
        }

        private void forceRuntimeEnd(Long sessionId) {
                Instant endedAt = Instant.now().minusSeconds(1);
                redisTemplate.opsForHash().put(
                                auctionRedisService.stateKey(sessionId),
                                AuctionRedisService.FIELD_END_TIME_EPOCH_MS,
                                String.valueOf(endedAt.toEpochMilli()));
                AuctionSession session = auctionSessionRepository.findById(sessionId).orElseThrow();
                session.setEndTime(endedAt);
                auctionSessionRepository.saveAndFlush(session);
        }

        private void runSchedulerEnabled(Runnable action) {
                boolean previous = auctionProperties.getScheduler().isEnabled();
                auctionProperties.getScheduler().setEnabled(true);
                try {
                        action.run();
                } finally {
                        auctionProperties.getScheduler().setEnabled(previous);
                }
        }
}
