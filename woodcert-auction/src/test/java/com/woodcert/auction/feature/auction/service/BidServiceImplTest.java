package com.woodcert.auction.feature.auction.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.auction.config.AuctionProperties;
import com.woodcert.auction.feature.auction.dto.request.CreateBidReq;
import com.woodcert.auction.feature.auction.dto.response.BidResultRes;
import com.woodcert.auction.feature.auction.entity.AuctionSession;
import com.woodcert.auction.feature.auction.entity.AuctionSessionStatus;
import com.woodcert.auction.feature.auction.entity.BidStatus;
import com.woodcert.auction.feature.auction.repository.AuctionSessionRepository;
import com.woodcert.auction.feature.catalog.entity.Product;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BidServiceImplTest {

    private static final Long AUCTION_ID = 99L;
    private static final String BIDDER_ID = "bidder-001";
    private static final String SELLER_ID = "seller-001";

    @Mock private AuctionSessionRepository auctionSessionRepository;
    @Mock private AuctionBroadcastService auctionBroadcastService;
    @Mock private BidLuaScript bidLuaScript;
    @Mock private BidPersistenceService bidPersistenceService;
    @Mock private AuctionRedisService auctionRedisService;
    @Mock private StringRedisTemplate redisTemplate;

    private BidServiceImpl bidService;

    @BeforeEach
    void setUp() {
        AuctionProperties auctionProperties = new AuctionProperties();
        bidService = new BidServiceImpl(
                auctionSessionRepository,
                auctionBroadcastService,
                bidLuaScript,
                bidPersistenceService,
                auctionRedisService,
                auctionProperties,
                redisTemplate
        );
    }

    @Test
    @DisplayName("should accept bid on Lua success even if secondary persistence fails")
    void placeBid_validBid_persistenceFailureStillSucceeds() {
        AuctionSession session = createActiveSession();
        CreateBidReq request = new CreateBidReq(AUCTION_ID, new BigDecimal("120.00"));
        Instant newEndTime = Instant.parse("2026-05-01T10:01:00Z");

        when(auctionSessionRepository.findByIdWithProduct(AUCTION_ID)).thenReturn(Optional.of(session));
        when(bidLuaScript.buildKeys(AUCTION_ID)).thenReturn(List.of("state", "bidders"));
        when(bidLuaScript.getScript()).thenReturn(new DefaultRedisScript<>());
        doReturn(List.of("OK", "120.00", String.valueOf(newEndTime.toEpochMilli())))
                .when(redisTemplate).execute(any(), anyList(), any(), any(), any(), any(), any(), any());
        doThrow(new RuntimeException("bid table unavailable"))
                .when(bidPersistenceService)
                .saveBid(any(), eq(AUCTION_ID), eq(BIDDER_ID), eq(new BigDecimal("120.00")), eq(BidStatus.VALID), any());
        when(auctionSessionRepository.findById(AUCTION_ID)).thenReturn(Optional.of(session));

        BidResultRes result = bidService.placeBid(BIDDER_ID, request);

        assertThat(result.auctionSessionId()).isEqualTo(AUCTION_ID);
        assertThat(result.currentPrice()).isEqualByComparingTo("120.00");
        assertThat(result.endTime()).isEqualTo(newEndTime);
        verify(auctionBroadcastService).broadcastNewBid(AUCTION_ID, new BigDecimal("120.00"), BIDDER_ID, newEndTime);
        verify(auctionRedisService).extendTtl(AUCTION_ID, newEndTime);
        verify(auctionSessionRepository).saveAndFlush(session);
    }

    @Test
    @DisplayName("should broadcast before persisting accepted bid")
    void placeBid_validBid_broadcastsBeforePersistence() {
        AuctionSession session = createActiveSession();
        CreateBidReq request = new CreateBidReq(AUCTION_ID, new BigDecimal("130.00"));
        Instant newEndTime = Instant.parse("2026-05-01T10:02:00Z");

        when(auctionSessionRepository.findByIdWithProduct(AUCTION_ID)).thenReturn(Optional.of(session));
        when(bidLuaScript.buildKeys(AUCTION_ID)).thenReturn(List.of("state", "bidders"));
        when(bidLuaScript.getScript()).thenReturn(new DefaultRedisScript<>());
        doReturn(List.of("OK", "130.00", String.valueOf(newEndTime.toEpochMilli())))
                .when(redisTemplate).execute(any(), anyList(), any(), any(), any(), any(), any(), any());
        when(auctionSessionRepository.findById(AUCTION_ID)).thenReturn(Optional.of(session));

        bidService.placeBid(BIDDER_ID, request);

        InOrder inOrder = inOrder(auctionBroadcastService, bidPersistenceService);
        inOrder.verify(auctionBroadcastService).broadcastNewBid(AUCTION_ID, new BigDecimal("130.00"), BIDDER_ID, newEndTime);
        inOrder.verify(bidPersistenceService).saveBid(any(), eq(AUCTION_ID), eq(BIDDER_ID), eq(new BigDecimal("130.00")), eq(BidStatus.VALID), any());
    }

    @Test
    @DisplayName("should persist invalid price attempt and return business error")
    void placeBid_lowBid_rejected() {
        AuctionSession session = createActiveSession();
        CreateBidReq request = new CreateBidReq(AUCTION_ID, new BigDecimal("101.00"));

        when(auctionSessionRepository.findByIdWithProduct(AUCTION_ID)).thenReturn(Optional.of(session));
        when(bidLuaScript.buildKeys(AUCTION_ID)).thenReturn(List.of("state", "bidders"));
        when(bidLuaScript.getScript()).thenReturn(new DefaultRedisScript<>());
        doReturn(List.of("LOW", "100.00", String.valueOf(session.getEndTime().toEpochMilli())))
                .when(redisTemplate).execute(any(), anyList(), any(), any(), any(), any(), any(), any());

        assertThatThrownBy(() -> bidService.placeBid(BIDDER_ID, request))
                .isInstanceOf(AppException.class)
                .satisfies(throwable ->
                        assertThat(((AppException) throwable).getErrorCode()).isEqualTo(ErrorCode.BID_AMOUNT_TOO_LOW));

        verify(bidPersistenceService).saveBid(any(), eq(AUCTION_ID), eq(BIDDER_ID), eq(new BigDecimal("101.00")), eq(BidStatus.INVALID_PRICE), any());
        verify(auctionBroadcastService, never()).broadcastNewBid(any(), any(), any(), any());
    }

    @Test
    @DisplayName("should persist ended attempt and return business error")
    void placeBid_ended_rejected() {
        AuctionSession session = createActiveSession();
        CreateBidReq request = new CreateBidReq(AUCTION_ID, new BigDecimal("150.00"));

        when(auctionSessionRepository.findByIdWithProduct(AUCTION_ID)).thenReturn(Optional.of(session));
        when(bidLuaScript.buildKeys(AUCTION_ID)).thenReturn(List.of("state", "bidders"));
        when(bidLuaScript.getScript()).thenReturn(new DefaultRedisScript<>());
        doReturn(List.of("ENDED", "100.00", String.valueOf(session.getEndTime().toEpochMilli())))
                .when(redisTemplate).execute(any(), anyList(), any(), any(), any(), any(), any(), any());

        assertThatThrownBy(() -> bidService.placeBid(BIDDER_ID, request))
                .isInstanceOf(AppException.class)
                .satisfies(throwable ->
                        assertThat(((AppException) throwable).getErrorCode()).isEqualTo(ErrorCode.BID_AUCTION_ENDED));

        verify(bidPersistenceService).saveBid(any(), eq(AUCTION_ID), eq(BIDDER_ID), eq(new BigDecimal("150.00")), eq(BidStatus.REJECTED_TIME), any());
    }

    private AuctionSession createActiveSession() {
        Product product = new Product();
        product.setSellerId(SELLER_ID);

        AuctionSession session = new AuctionSession();
        session.setId(AUCTION_ID);
        session.setStatus(AuctionSessionStatus.ACTIVE);
        session.setCurrentPrice(new BigDecimal("100.00"));
        session.setEndTime(Instant.parse("2026-05-01T10:00:00Z"));
        session.setProduct(product);
        return session;
    }
}
