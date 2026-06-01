package com.woodcert.auction.feature.auction.service;

import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.feature.auction.dto.request.CreateAuctionSessionReq;
import com.woodcert.auction.feature.auction.dto.response.AuctionDetailRes;
import com.woodcert.auction.feature.auction.dto.response.AuctionListRes;
import com.woodcert.auction.feature.auction.dto.response.BidHistoryItemRes;
import com.woodcert.auction.feature.auction.dto.response.MyParticipationRes;
import com.woodcert.auction.feature.auction.dto.response.SellerAuctionDetailRes;
import com.woodcert.auction.feature.auction.dto.response.SellerAuctionListRes;
import com.woodcert.auction.feature.auction.service.command.AuctionCommandService;
import com.woodcert.auction.feature.auction.service.query.AuctionQueryService;
import com.woodcert.auction.feature.auction.service.query.PublicAuctionSearchCriteria;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Test unit cho AuctionService facade.
 *
 * Nhóm test này kiểm tra service có chuyển đúng việc sang service ghi/đọc dữ liệu
 * và gom filter từ controller vào criteria đúng không.
 */
@ExtendWith(MockitoExtension.class)
class AuctionServiceImplTest {

    @Mock
    private AuctionCommandService commandService;
    @Mock
    private AuctionQueryService queryService;

    @InjectMocks
    private AuctionServiceImpl auctionService;

    @Test
    void createAuctionSession_delegatesToCommandService() {
        CreateAuctionSessionReq request = validRequest();
        AuctionDetailRes expected = detailRes();
        when(commandService.createAuctionSession("seller-1", request)).thenReturn(expected);

        AuctionDetailRes result = auctionService.createAuctionSession("seller-1", request);

        assertThat(result).isSameAs(expected);
        verify(commandService).createAuctionSession("seller-1", request);
    }

    @Test
    void getPublicAuctions_delegatesToQueryService() {
        PaginationResponse<AuctionListRes> expected = new PaginationResponse<>(
                new PaginationResponse.Meta(1, 10, 0, 0),
                List.of());
        when(queryService.getPublicAuctions(any(PublicAuctionSearchCriteria.class))).thenReturn(expected);

        var result = auctionService.getPublicAuctions(
                1, 10, "ACTIVE", "rosewood", "Fine sculpture",
                new BigDecimal("1000000"), new BigDecimal("5000000"));

        assertThat(result).isSameAs(expected);
        ArgumentCaptor<PublicAuctionSearchCriteria> captor =
                ArgumentCaptor.forClass(PublicAuctionSearchCriteria.class);
        verify(queryService).getPublicAuctions(captor.capture());
        assertThat(captor.getValue().page()).isEqualTo(1);
        assertThat(captor.getValue().size()).isEqualTo(10);
        assertThat(captor.getValue().status()).isEqualTo("ACTIVE");
        assertThat(captor.getValue().material()).isEqualTo("rosewood");
        assertThat(captor.getValue().categoryName()).isEqualTo("Fine sculpture");
        assertThat(captor.getValue().priceMin()).isEqualByComparingTo("1000000");
        assertThat(captor.getValue().priceMax()).isEqualByComparingTo("5000000");
    }

    @Test
    void getPublicAuctionDetail_delegatesToQueryService() {
        AuctionDetailRes expected = detailRes();
        when(queryService.getPublicAuctionDetail(10L)).thenReturn(expected);

        AuctionDetailRes result = auctionService.getPublicAuctionDetail(10L);

        assertThat(result).isSameAs(expected);
        verify(queryService).getPublicAuctionDetail(10L);
    }

    @Test
    void getMyParticipation_delegatesToQueryService() {
        MyParticipationRes expected = new MyParticipationRes(
                false, true, null, false, false, true, "CAN_BID", "ok", BigDecimal.ONE, false, "NONE", "");
        when(queryService.getMyParticipation("bidder-1", 10L)).thenReturn(expected);

        MyParticipationRes result = auctionService.getMyParticipation("bidder-1", 10L);

        assertThat(result).isSameAs(expected);
        verify(queryService).getMyParticipation("bidder-1", 10L);
    }

    @Test
    void getBidHistory_delegatesToQueryService() {
        List<BidHistoryItemRes> expected = List.of();
        when(queryService.getBidHistory(10L, 20, "bidder-1")).thenReturn(expected);

        List<BidHistoryItemRes> result = auctionService.getBidHistory(10L, 20, "bidder-1");

        assertThat(result).isSameAs(expected);
        verify(queryService).getBidHistory(10L, 20, "bidder-1");
    }

    @Test
    void getSellerAuctions_delegatesToQueryService() {
        PaginationResponse<SellerAuctionListRes> expected = new PaginationResponse<>(
                new PaginationResponse.Meta(1, 10, 0, 0),
                List.of());
        when(queryService.getSellerAuctions("seller-1", 1, 10, "ACTIVE")).thenReturn(expected);

        var result = auctionService.getSellerAuctions("seller-1", 1, 10, "ACTIVE");

        assertThat(result).isSameAs(expected);
        verify(queryService).getSellerAuctions("seller-1", 1, 10, "ACTIVE");
    }

    @Test
    void getSellerAuctionDetail_delegatesToQueryService() {
        SellerAuctionDetailRes expected = sellerDetailRes();
        when(queryService.getSellerAuctionDetail("seller-1", 10L)).thenReturn(expected);

        SellerAuctionDetailRes result = auctionService.getSellerAuctionDetail("seller-1", 10L);

        assertThat(result).isSameAs(expected);
        verify(queryService).getSellerAuctionDetail("seller-1", 10L);
    }

    @Test
    void cancelAuctionSession_delegatesToCommandService() {
        auctionService.cancelAuctionSession("seller-1", 10L);

        verify(commandService).cancelAuctionSession("seller-1", 10L);
    }

    @Test
    void registerForAuction_delegatesToCommandService() {
        auctionService.registerForAuction("bidder-1", 10L);

        verify(commandService).registerForAuction("bidder-1", 10L);
    }

    private CreateAuctionSessionReq validRequest() {
        return new CreateAuctionSessionReq(
                1L,
                new BigDecimal("10000000"),
                new BigDecimal("12000000"),
                new BigDecimal("100000"),
                new BigDecimal("1000000"),
                Instant.now().plusSeconds(3600),
                Instant.now().plusSeconds(7200));
    }

    private AuctionDetailRes detailRes() {
        return new AuctionDetailRes(
                10L,
                null,
                BigDecimal.ONE,
                BigDecimal.ONE,
                BigDecimal.ONE,
                BigDecimal.ONE,
                Instant.now(),
                Instant.now(),
                null,
                null,
                null);
    }

    private SellerAuctionDetailRes sellerDetailRes() {
        return new SellerAuctionDetailRes(
                10L,
                null,
                BigDecimal.ONE,
                BigDecimal.ONE,
                BigDecimal.ONE,
                BigDecimal.ONE,
                BigDecimal.ONE,
                null,
                Instant.now(),
                Instant.now(),
                0,
                null,
                SellerAuctionDetailRes.SellerAuctionSettlementStatus.NOT_APPLICABLE,
                new SellerAuctionDetailRes.SettlementSummary(0, 0, 0, 0),
                null,
                Instant.now(),
                Instant.now());
    }
}
