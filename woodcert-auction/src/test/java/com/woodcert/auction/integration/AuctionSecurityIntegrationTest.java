package com.woodcert.auction.integration;

import com.woodcert.auction.feature.auction.dto.request.CreateAuctionSessionReq;
import com.woodcert.auction.feature.auction.dto.request.CreateBidReq;
import com.woodcert.auction.feature.auction.entity.AuctionSession;
import com.woodcert.auction.feature.auction.entity.AuctionSessionStatus;
import com.woodcert.auction.feature.catalog.entity.Product;
import com.woodcert.auction.feature.identity.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.math.BigDecimal;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test integration cho bảo mật endpoint đấu giá.
 *
 * Test này kiểm tra endpoint nào public, endpoint nào cần quyền trong JWT và
 * subject đang đăng nhập có được dùng đúng làm actor id khi đăng ký phiên không.
 */
class AuctionSecurityIntegrationTest extends AuctionIntegrationTestBase {

    @Test
    void publicAuctionListAndDetailAreAccessibleWithoutJwt() throws Exception {
        User seller = createSeller("seller-security-public@example.com");
        Product product = createAppraisedProduct(seller.getId());
        AuctionSession session = createSession(product, AuctionSessionStatus.WAITING,
                Instant.now().plusSeconds(3600), Instant.now().plusSeconds(7200), new BigDecimal("12000000.00"));

        mockMvc.perform(get("/api/v1/auctions"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/auctions/{id}", session.getId()))
                .andExpect(status().isOk());
    }

    @Test
    void auctionMutationEndpointsRequireJwtAndCorrectAuthorities() throws Exception {
        User seller = createSeller("seller-security-mutation@example.com");
        Product product = createAppraisedProduct(seller.getId());
        AuctionSession session = createSession(product, AuctionSessionStatus.WAITING,
                Instant.now().plusSeconds(3600), Instant.now().plusSeconds(7200), new BigDecimal("12000000.00"));

        mockMvc.perform(post("/api/v1/auctions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest(product.getId()))))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/auctions")
                        .with(jwt().jwt(jwt -> jwt.subject(seller.getId()))
                                .authorities(authorities("CREATE_BID")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest(product.getId()))))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch("/api/v1/auctions/{id}/cancel", session.getId()))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/v1/auctions/{id}/register", session.getId()))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/v1/bids")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateBidReq(session.getId(), new BigDecimal("10100000.00")))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void jwtSubjectIsUsedAsActorIdForRegistration() throws Exception {
        User seller = createSeller("seller-security-subject@example.com");
        User bidder = createUser("bidder-security-subject@example.com");
        createWallet(bidder.getId(), new BigDecimal("5000000.00"), BigDecimal.ZERO);
        Product product = createAppraisedProduct(seller.getId());
        AuctionSession session = createSession(product, AuctionSessionStatus.WAITING,
                Instant.now().plusSeconds(3600), Instant.now().plusSeconds(7200), new BigDecimal("12000000.00"));

        mockMvc.perform(post("/api/v1/auctions/{id}/register", session.getId())
                        .with(jwt().jwt(jwt -> jwt.subject(bidder.getId()))
                                .authorities(authorities("JOIN_AUCTION"))))
                .andExpect(status().isOk());

        assertThat(auctionParticipantRepository.findByAuctionSessionIdAndUserId(session.getId(), bidder.getId()))
                .isPresent();
        assertThat(auctionParticipantRepository.findByAuctionSessionIdAndUserId(session.getId(), seller.getId()))
                .isEmpty();
    }

    @Test
    void sellerAuctionListAcceptsStatusFilter() throws Exception {
        User seller = createSeller("seller-security-filter@example.com");
        Product activeProduct = createAppraisedProduct(seller.getId());
        Product waitingProduct = createAppraisedProduct(seller.getId());
        createSession(activeProduct, AuctionSessionStatus.ACTIVE,
                Instant.now().minusSeconds(60), Instant.now().plusSeconds(3600), new BigDecimal("12000000.00"));
        createSession(waitingProduct, AuctionSessionStatus.WAITING,
                Instant.now().plusSeconds(3600), Instant.now().plusSeconds(7200), new BigDecimal("12000000.00"));

        mockMvc.perform(get("/api/v1/auctions/me")
                        .param("status", "ACTIVE")
                        .with(jwt().jwt(jwt -> jwt.subject(seller.getId()))
                                .authorities(authorities("CREATE_AUCTION_SESSION"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.meta.total").value(1))
                .andExpect(jsonPath("$.data.result[0].status").value("ACTIVE"));
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
}
